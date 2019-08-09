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

export default class CWABotError extends Error {
    public readonly returnError: string;
    public readonly returnrecommendation: string;
    public readonly consolePrint: string;
    public readonly errorCode: BotErrorCodes;
    constructor(errorCode: BotErrorCodes) {
        super()
        this.returnError = botErrors[errorCode].returnError;
        this.returnrecommendation = botErrors[errorCode].returnRecommendation;
        this.consolePrint = botErrors[errorCode].consolePrint;
        this.errorCode = errorCode;
    }
}

const botErrors: BotError = {
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