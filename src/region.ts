export interface regionDataStruc {
    serverName: string,
    apiDomainName: string,
    shortServerName: string,
    portalPage: string,
    mainLanguage: string,
    toplevelDomain: string
}

export enum region {
    NA = 'NA',
    ASIA = 'ASIA',
    EU = 'EU',
    RU = 'RU'
}

export const regionData: Map<region,regionDataStruc> = new Map([
    [region.NA, {
        serverName: "North America Server",
        apiDomainName: "api.wotblitz.com",
        shortServerName: "NA",
        portalPage: "wotblitz.com",
        mainLanguage: "en",
        toplevelDomain: "com"
    }],
    [region.ASIA, {
        serverName: "Asia Server",
        apiDomainName: "api.wotblitz.asia",
        shortServerName: "ASIA",
        portalPage: "wotblitz.asia",
        mainLanguage: "en",
        toplevelDomain: "asia"
    }],
    [region.EU,{
        serverName: "European Server",
        apiDomainName: "api.wotblitz.eu",
        shortServerName: "EU",
        portalPage: "wotblitz.eu",
        mainLanguage: "en",
        toplevelDomain: "eu"
    }],
    [region.RU,{
        serverName: "Russian Server",
        apiDomainName: "api.wotblitz.ru",
        shortServerName: "RU",
        portalPage: "wotblitz.ru",
        mainLanguage: "ru",
        toplevelDomain: "ru"
    }]
])