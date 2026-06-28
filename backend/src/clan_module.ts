// clan_module.ts
// Klan sistemi - Nakama Groups API kullanılarak

let clanCreateRpc: nkruntime.RpcFunction;
let clanJoinRpc: nkruntime.RpcFunction;
let clanLeaveRpc: nkruntime.RpcFunction;
let clanListRpc: nkruntime.RpcFunction;
let clanInfoRpc: nkruntime.RpcFunction;
let clanKickRpc: nkruntime.RpcFunction;
let clanPromoteRpc: nkruntime.RpcFunction;
let clanSearchRpc: nkruntime.RpcFunction;
let clanStartTeamMatchRpc: nkruntime.RpcFunction;
let beforeGetAccountHook: nkruntime.BeforeGetAccountFunction;

clanCreateRpc = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    let request = JSON.parse(payload);
    let clanName = request.name;

    if (!clanName || clanName.length < 3) {
        return JSON.stringify({ success: false, error: "Clan name too short." });
    }

    try {
        let group = nk.groupCreate(ctx.userId, clanName, ctx.userId, 'en', "", "", true, {
            owner_id: ctx.userId,
        }, 50);

        logger.info("Clan created: %s by user %s", group.id, ctx.userId);
        return JSON.stringify({
            success: true,
            clan_id: group.id,
            name: group.name,
        });
    } catch (e) {
        logger.error("Failed to create clan: %s", e);
        return JSON.stringify({ success: false, error: "Failed to create clan." });
    }
};

clanJoinRpc = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    let request = JSON.parse(payload);
    let clanId = request.clan_id;

    try {
        nk.groupUserJoin(ctx.userId, ctx.sessionId, clanId);
        logger.info("User %s joined clan %s", ctx.userId, clanId);
        return JSON.stringify({ success: true, message: "Joined clan successfully." });
    } catch (e) {
        logger.error("Failed to join clan: %s", e);
        return JSON.stringify({ success: false, error: "Failed to join clan." });
    }
};