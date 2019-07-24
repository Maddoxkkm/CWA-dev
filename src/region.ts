export enum region {
    NA = 'NA',
    ASIA = 'ASIA',
    EU = 'EU',
    RU = 'RU'
}

export type regionalData = {
    readonly [index in region]: {
        readonly serverName: string,
        readonly apiDomainName: string,
        readonly shortServerName: string,
        readonly portalPage: string,
        readonly mainLanguage: string,
        readonly toplevelDomain: string
    }
}
export const regionData: regionalData = {
    NA: {
        serverName: "North America Server",
        apiDomainName: "api.wotblitz.com",
        shortServerName: "NA",
        portalPage: "wotblitz.com",
        mainLanguage: "en",
        toplevelDomain: "com"
    },
    ASIA: {
        serverName: "Asia Server",
        apiDomainName: "api.wotblitz.asia",
        shortServerName: "ASIA",
        portalPage: "wotblitz.asia",
        mainLanguage: "en",
        toplevelDomain: "asia"
    },
    EU: {
        serverName: "European Server",
        apiDomainName: "api.wotblitz.eu",
        shortServerName: "EU",
        portalPage: "wotblitz.eu",
        mainLanguage: "en",
        toplevelDomain: "eu"
    },
    RU: {
        serverName: "Russian Server",
        apiDomainName: "api.wotblitz.ru",
        shortServerName: "RU",
        portalPage: "wotblitz.ru",
        mainLanguage: "ru",
        toplevelDomain: "ru"
    }
}