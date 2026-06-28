// account_module.ts
// Apple/Google/Email auth hooks, kullanıcı oluşturma, username/profil işlemleri

let beforeAuthenticateApple: nkruntime.BeforeAuthenticateAppleFunction;
let beforeAuthenticateGoogle: nkruntime.BeforeAuthenticateGoogleFunction;
let beforeAuthenticateEmail: nkruntime.BeforeAuthenticateEmailFunction;
let afterAuthenticateApple: nkruntime.AfterAuthenticateAppleFunction;
let afterAuthenticateGoogle: nkruntime.AfterAuthenticateGoogleFunction;
let afterAuthenticateEmail: nkruntime.AfterAuthenticateEmailFunction;

beforeAuthenticateApple = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.AuthenticateAppleRequest): nkruntime.AuthenticateAppleRequest | undefined {
    logger.info("Before Apple authenticate for token: %s", data.token?.substring(0, 10) + "...");
    return data;
};

beforeAuthenticateGoogle = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.AuthenticateGoogleRequest): nkruntime.AuthenticateGoogleRequest | undefined {
    logger.info("Before Google authenticate for token: %s", data.token?.substring(0, 10) + "...");
    return data;
};

beforeAuthenticateEmail = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.AuthenticateEmailRequest): nkruntime.AuthenticateEmailRequest | undefined {
    logger.info("Before Email authenticate for: %s", data.email);
    return data;
};

afterAuthenticateApple = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.Session, request: nkruntime.AuthenticateAppleRequest) {
    logger.info("After Apple authenticate for user: %s", data.userId);
};

afterAuthenticateGoogle = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.Session, request: nkruntime.AuthenticateGoogleRequest) {
    logger.info("After Google authenticate for user: %s", data.userId);
};

afterAuthenticateEmail = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.Session, request: nkruntime.AuthenticateEmailRequest) {
    logger.info("After Email authenticate for user: %s", data.userId);
};