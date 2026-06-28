// battle_match_handler.ts
// Savaş'ın ana state machine'i

let matchInit: nkruntime.MatchInitFunction;
let matchJoin: nkruntime.MatchJoinFunction;
let matchJoinAttempt: nkruntime.MatchJoinAttemptFunction;
let matchLeave: nkruntime.MatchLeaveFunction;
let matchLoop: nkruntime.MatchLoopFunction;
let matchTerminate: nkruntime.MatchTerminateFunction;
let matchSignal: nkruntime.MatchSignalFunction;

matchInit = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [key: string]: any }): { state: nkruntime.MatchState, tickRate: number, label: string } {
    logger.info("Match init with params: %s", JSON.stringify(params));

    let mapId = params.map_id || 'map_random';
    let gameMode = params.game_mode || 'kill_based';
    let teamSize = params.team_size || 3;
    let matchDuration = params.match_duration_sec || 180;

    let initialState: any = {
        match_id: ctx.matchId,
        map_id: mapId,
        game_mode: gameMode,
        team_size: teamSize,
        match_duration_sec: matchDuration,
        start_time: Date.now(),
        end_time: Date.now() + matchDuration * 1000,
        teams: {},
        items: [],
        scores: {},
        winner_team: -1,
        match_ended: false,
    };

    // Initialize teams
    for (let i = 0; i < params.teams.length; i++) {
        initialState.teams[i] = [];
        initialState.scores[i] = 0;
        for (let playerData of params.teams[i]) {
            let player = createPlayerState(playerData, i);
            initialState.teams[i].push(player);
        }
    }

    let state: nkruntime.MatchState = {
        state: initialState,
        tickRate: 20,
        label: "Clans Online Battle - " + mapId,
    };

    return state;
};

matchJoin = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): nkruntime.MatchState {
    logger.info("Players joined: %d", presences.length);

    let matchState = state.state as any;

    for (let presence of presences) {
        for (let teamIndex in matchState.teams) {
            let team = matchState.teams[teamIndex];
            for (let player of team) {
                if (player.user_id === presence.userId) {
                    player.disconnected = false;
                    logger.info("Player %s reconnected to match", presence.username);
                }
            }
        }
    }

    dispatcher.broadcastMessage(1, JSON.stringify({
        type: 'players_joined',
        count: presences.length,
    }));

    return { state: matchState, tickRate: 20, label: state.label };
};

matchJoinAttempt = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: { [key: string]: any }): { state: nkruntime.MatchState, accept: boolean, rejectReason?: string } {
    let matchState = state.state as any;

    for (let team of Object.values(matchState.teams)) {
        for (let player of team) {
            if (player.user_id === presence.userId) {
                return { state: state, accept: true };
            }
        }
    }

    return { state: state, accept: false, rejectReason: "Not part of this match." };
};

matchLeave = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): nkruntime.MatchState {
    let matchState = state.state as any;

    for (let presence of presences) {
        logger.info("Player %s disconnected from match", presence.username);

        for (let teamIndex in matchState.teams) {
            let team = matchState.teams[teamIndex];
            for (let player of team) {
                if (player.user_id === presence.userId) {
                    player.disconnected = true;
                    player.last_activity_time = Date.now();
                    break;
                }
            }
        }
    }

    return { state: matchState, tickRate: 20, label: state.label };
};

matchLoop = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]): nkruntime.MatchState {
    let matchState = state.state as any;
    let currentTime = Date.now();

    // Process incoming messages
    for (let message of messages) {
        try {
            let data = JSON.parse(nk.binaryToString(message.data));
            processMatchMessage(dispatcher, matchState, message.sender.userId, data, currentTime);
        } catch (e) {
            logger.warn("Failed to parse match message: %s", e);
        }
    }

    // Update match state
    updateMatchState(matchState, currentTime, dispatcher);

    // Check match end conditions
    if (!matchState.match_ended) {
        checkMatchEnd(matchState, currentTime, dispatcher, logger);
    }

    // Handle AFK players
    handleAfkPlayers(matchState, currentTime, dispatcher, logger);

    // Send periodic state update
    if (tick % 10 === 0) {
        sendStateUpdate(dispatcher, matchState);
    }

    return { state: matchState, tickRate: 20, label: state.label };
};

matchTerminate = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number): nkruntime.MatchState {
    let matchState = state.state as any;
    logger.info("Match terminating: %s", matchState.match_id);

    if (!matchState.match_ended) {
        determineWinner(matchState, logger);
    }

    dispatcher.broadcastMessage(1, JSON.stringify({
        type: 'match_terminated',
        results: getMatchResults(matchState),
    }));

    distributeRewards(matchState, nk, logger);

    return state;
};

matchSignal = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, signal: string): nkruntime.MatchState {
    logger.info("Match signal received: %s", signal);
    return state;
};

// ============ Helper Functions ============

function createPlayerState(playerData: any, teamIndex: number): any {
    let baseStats = getCharacterBaseStatsById(playerData.character_id || 'char_warrior');
    let health = baseStats ? baseStats.base_health : 5000;

    return {
        user_id: playerData.user_id,
        username: playerData.username || 'Player',
        character_id: playerData.character_id || 'char_warrior',
        team_index: teamIndex,
        health: health,
        max_health: health,
        damage: baseStats ? baseStats.base_damage : 800,
        speed: baseStats ? baseStats.base_speed : 300,
        position_x: 0,
        position_y: 0,
        rotation: 0,
        alive: true,
        respawn_timer: 0,
        kills: 0,
        deaths: 0,
        score: 0,
        last_activity_time: Date.now(),
        is_afk: false,
        is_bot: playerData.is_bot || false,
        disconnected: false,
        level: 0,
        buffs: { health_buff: 0, damage_buff: 0, speed_buff: 0, health_regen_buff: 0 },
    };
}

function processMatchMessage(dispatcher: nkruntime.MatchDispatcher, matchState: any, senderId: string, data: any, currentTime: number): void {
    let player = findPlayerById(matchState, senderId);
    if (!player || player.is_afk) return;

    player.last_activity_time = currentTime;

    switch (data.type) {
        case 'player_input':
            player.position_x = data.position_x;
            player.position_y = data.position_y;
            player.rotation = data.rotation;
            break;
        case 'shoot':
            dispatcher.broadcastMessage(1, JSON.stringify({
                type: 'player_shot',
                user_id: player.user_id,
                timestamp: currentTime,
            }));
            break;
        case 'ping':
            break;
    }
}

function updateMatchState(matchState: any, currentTime: number, dispatcher: nkruntime.MatchDispatcher): void {
    for (let team of Object.values(matchState.teams)) {
        for (let player of team) {
            if (player.alive && player.health < player.max_health) {
                player.health = Math.min(player.max_health, player.health + 5);
            }
        }
    }
}

function handleAfkPlayers(matchState: any, currentTime: number, dispatcher: nkruntime.MatchDispatcher, logger: nkruntime.Logger): void {
    for (let team of Object.values(matchState.teams)) {
        for (let player of team) {
            if (player.is_bot) continue;
            if (!player.is_afk && isPlayerAfk(player, currentTime)) {
                player.is_afk = true;
                logger.info("Player %s is AFK", player.username);
            }
        }
    }
}

function findPlayerById(matchState: any, userId: string): any {
    for (let team of Object.values(matchState.teams)) {
        for (let player of team) {
            if (player.user_id === userId) return player;
        }
    }
    return null;
}

function checkMatchEnd(matchState: any, currentTime: number, dispatcher: nkruntime.MatchDispatcher, logger: nkruntime.Logger): void {
    if (currentTime >= matchState.end_time) {
        matchState.match_ended = true;
        determineWinner(matchState, logger);
        sendMatchEnd(dispatcher, matchState);
    }
}

function determineWinner(matchState: any, logger: nkruntime.Logger): void {
    if (matchState.winner_team >= 0) return;

    let maxScore = -1;
    let winner = 0;
    for (let teamIndex in matchState.scores) {
        if (matchState.scores[teamIndex] > maxScore) {
            maxScore = matchState.scores[teamIndex];
            winner = parseInt(teamIndex);
        }
    }
    matchState.winner_team = winner;
}

function sendMatchEnd(dispatcher: nkruntime.MatchDispatcher, matchState: any): void {
    dispatcher.broadcastMessage(1, JSON.stringify({
        type: 'match_ended',
        results: getMatchResults(matchState),
    }));
}

function getMatchResults(matchState: any): any {
    let results = {
        match_id: matchState.match_id,
        map_id: matchState.map_id,
        winner_team: matchState.winner_team,
        teams: {} as any,
        scores: matchState.scores,
    };

    for (let teamIndex in matchState.teams) {
        results.teams[teamIndex] = matchState.teams[teamIndex].map((p: any) => ({
            user_id: p.user_id,
            username: p.username,
            kills: p.kills,
            deaths: p.deaths,
            is_winner: parseInt(teamIndex) === matchState.winner_team,
            gold_earned: parseInt(teamIndex) === matchState.winner_team ? GOLD_WIN : GOLD_LOSS,
        }));
    }

    return results;
}

function distributeRewards(matchState: any, nk: nkruntime.Nakama, logger: nkruntime.Logger): void {
    for (let teamIndex in matchState.teams) {
        let isWinner = parseInt(teamIndex) === matchState.winner_team;
        let goldAmount = isWinner ? GOLD_WIN : GOLD_LOSS;

        for (let player of matchState.teams[teamIndex]) {
            if (player.is_bot) continue;

            try {
                let economy = getUserEconomy(nk, player.user_id);
                economy.gold += goldAmount;
                economy.total_gold_earned += goldAmount;
                nk.storageWrite([{ collection: StorageCollections.USER_ECONOMY, key: StorageKeys.ECONOMY, userId: player.user_id, value: economy, permissionRead: 2, permissionWrite: 0 }]);
                logger.info("Awarded %d gold to user %s", goldAmount, player.user_id);
            } catch (e) {
                logger.warn("Failed to award gold to user %s: %s", player.user_id, e);
            }
        }
    }
}

function sendStateUpdate(dispatcher: nkruntime.MatchDispatcher, matchState: any): void {
    let update = {
        type: 'state_update',
        players: [] as any[],
        scores: matchState.scores,
    };

    for (let team of Object.values(matchState.teams)) {
        for (let player of team) {
            update.players.push({
                user_id: player.user_id,
                position_x: player.position_x,
                position_y: player.position_y,
                health: Math.round(player.health),
                alive: player.alive,
                kills: player.kills,
            });
        }
    }

    dispatcher.broadcastMessage(2, JSON.stringify(update));
}

function getCharacterBaseStatsById(characterId: string): any {
    return allCharactersCache.find(c => c.id === characterId) || null;
}

function getUserEconomy(nk: nkruntime.Nakama, userId: string): any {
    let storageObjects = nk.storageRead([{ collection: StorageCollections.USER_ECONOMY, key: StorageKeys.ECONOMY, userId: userId }]);
    if (storageObjects && storageObjects.length > 0) {
        return storageObjects[0].value;
    }
    return { gold: 0, total_gold_earned: 0, total_gold_spent: 0 };
}