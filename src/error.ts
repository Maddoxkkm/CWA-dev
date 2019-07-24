export enum BotErrorCodes {
    UnexpectedError = 0,
    WGAPIError = 1
}

export type BotError = {
    readonly [index in BotErrorCodes]: {
        readonly returnError: string,
        readonly returnRecommendation: string,
        readonly consolePrint: string
    }
}

export const botErrors: BotError = {
    0: {
        returnError: "Unexpected Error!",
        returnRecommendation: "Bot has encountered unexpected error, please try again later",
        consolePrint: "unexpected bot error"

    },
    1: {
        returnError: "WG API Error!",
        returnRecommendation: "WG API Lookup returned unexpected results, please try again!",
        consolePrint: "wgAPI error"
    }
}
