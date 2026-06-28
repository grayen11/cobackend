// matchmaker_module.ts
// Eşleşme isteği RPC'si, matched-hook, bot doldurma

let requestMatchRpc: nkruntime.RpcFunction;
let cancelMatchRpc: nkruntime.RpcFunction;
let matchmakerMatchedHook: nkruntime.MatchmakerMatchedFunction;

requestMatchRpc = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    let request = JSON.parse(payload);
    let characterId = request.character_id;
    let mapId = request.map_id || 'random';

    try {
        let matchmakerTicket = nk.matchmakerCreate(
            2,
            4,
            '*',
            { character_id: characterId, map_id: mapId },
            { team_size: 2 }
        );

        return JSON.stringify({
            success: true,
            ticket: matchmakerTicket.ticket,
            message: "Searching for match..."
        });
    } catch (e) {
        logger.error("Matchmaker create error: %s", e);
        return JSON.stringify({ success: false, error: "Failed to create match request." });
    }
};

cancelMatchRpc = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    let request = JSON.parse(payload);
    let ticket = request.ticket;

    try {
        nk.matchmakerRemove(ticket);
        return JSON.stringify({ success: true, message: "Match request cancelled." });
    } catch (e) {
        return JSON.stringify({ success: false, error: "Failed to cancel match request." });
    }
};

matchmakerMatchedHook = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, matches: nkruntime.MatchmakerResult[]): string {
    logger.info("Matchmaker matched %d users", matches.length);
    return JSON.stringify({ match_ids: [] });
};