//Load Enmap and the base
import Enmap = require('enmap');

import { region, stringToRegion } from './region'
import { Snowflake } from 'discord.js';
import { Player } from './player';
import { PlayerStatsOverviewData, PlayerClanData } from './wg-api/interface';

export enum PlayerDBOperationResults {
    Okay = 0,
    DiscordIDExists = 1,
    WGIDExists = 2,
    NoBattles = 3,
    PlayerNotFound = 4,
}

export interface PlayerDBEntry {
    wgID: number,
    lastUpdated: number,
    region: region,
    player: PlayerStatsOverviewData,
    clan: PlayerClanData | undefined,
    language: Language,
    enforceNickname: Boolean,
}

export enum Language {
    EN = 'en',
    JP = 'jp'
}

export class PlayerDB extends Enmap<Snowflake, PlayerDBEntry>{
    private readonly debug: boolean;
    
    constructor(debug: boolean = false) {
        if (debug) {
            super();
        } else {
            super(`mainStorage`);
        }
        this.debug = debug;
    }

    public async setPlayer(wgID: number, realm: region, discordID: Snowflake): Promise<PlayerDBOperationResults> {
        //reject when DiscordID exists in the DB
        if (this.has(discordID)) throw 1;
        //reject when WargamingID is found in the DB
        if (this.exists('wgID', wgID)) throw 2;

        const player: Player = new Player(wgID, realm);

        const playerStats: PlayerStatsOverviewData | undefined = await player.statsOverview();

        // Null values indicates the players has no battles.
        if (!playerStats) throw 3

        const data: PlayerDBEntry = {
            wgID: wgID,
            lastUpdated: new Date().getTime(),
            region: realm,
            player: playerStats,
            clan: await player.clanData(),
            // Default them to EN language
            language: Language.EN,
            enforceNickname: true
        };

        this.set(discordID, data);
        return 0;
    }

    public hasPlayer(discordID: Snowflake, wgID: number = 0): boolean {
        if (wgID === 0) return this.has(discordID)
        else return this.has(discordID) || this.exists('wgID', wgID)
    }

    public async updateProfile(discordID: Snowflake, playerUpdatePeriod: number = 43200000): Promise<PlayerDBOperationResults> {
        let profile: PlayerDBEntry | undefined = this.get(discordID);
        if (!profile) throw 4

        const now: number = new Date().getTime();

        if (profile.lastUpdated + playerUpdatePeriod < now) {
            const player: Player = new Player(profile.wgID, stringToRegion(profile.region));
            const newPlayerStats: PlayerStatsOverviewData | undefined = await player.statsOverview();

            // Null values indicates the players has no battles.
            // Should not happen but just in case
            if (!newPlayerStats) throw 3

            profile.player = newPlayerStats;
            profile.clan = await player.clanData();
            profile.lastUpdated = now;

            this.set(discordID, profile)
        }
        return 0;
    }
}