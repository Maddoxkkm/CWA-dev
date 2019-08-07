//Load Enmap and the base
import Enmap = require('enmap');

import { region, stringToRegion } from './region'
import { Snowflake } from 'discord.js';
import Player from './player';
import { PlayerStatsOverviewData, PlayerClanData } from './wg-api/interface';

import { debug } from '../secrets.json'

export enum PlayerDBOperationResults {
    Okay = 0,
    DiscordIDExists = 1,
    WGIDExists = 2,
    NoBattles = 3,
    PlayerNotFound = 4,
    UpdateNotNeeded = 5,
}

export interface PlayerDBEntry {
    wgID: number,
    lastUpdated: number,
    region: region,
    player: PlayerStatsOverviewData,
    clan: PlayerClanData | undefined,
    enforceNickname: boolean,
    notificationRole: boolean
}

class PlayerDB extends Enmap<Snowflake, PlayerDBEntry>{
    private readonly debug: boolean;

    constructor(debug: boolean = false) {
        if (debug) {
            super();
        } else {
            super(`mainStorage`);
        }
        this.debug = debug;
    }

    public get getSet(): Set<PlayerDBEntry> {
        return new Set(this.values());
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
            enforceNickname: true,
            // Default them to Receive all notifications
            notificationRole: true,
        };

        this.set(discordID, data);
        return 0;
    }

    public hasPlayer(discordID: Snowflake, wgID: number = 0): boolean {
        if (wgID === 0) return this.has(discordID)
        else return this.has(discordID) || this.exists('wgID', wgID)
    }

    public async updateProfile(discordID: Snowflake, playerUpdatePeriod: number = 43200000): Promise<PlayerDBOperationResults> {
        const profile: PlayerDBEntry | undefined = this.get(discordID);
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
            return 0;
        } else return 5;
    }

    public async toggleNicknameEnforce(discordID: Snowflake): Promise<boolean> {
        const profile: PlayerDBEntry | undefined = this.get(discordID);
        if (!profile) throw 4

        const newBool: boolean = !profile.enforceNickname
        profile.enforceNickname = newBool;

        this.set(discordID, profile);
        return newBool
    }

    public async toggleNotification(discordID: Snowflake): Promise<boolean> {
        const profile: PlayerDBEntry | undefined = this.get(discordID);
        if (!profile) throw 4

        const newBool: boolean = !profile.notificationRole
        profile.notificationRole = newBool;

        this.set(discordID, profile);
        return newBool
    }
}

export default new PlayerDB(debug);
export { PlayerDB as DB }