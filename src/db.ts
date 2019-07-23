//Load Enmap and the base
import Enmap = require('enmap');

import { region, regionData } from './region'
import { Snowflake } from 'discord.js';
import { Player } from './player';
import { PlayerStatsOverviewData, PlayerClanData } from './wg-api/interface';

//Import Request
//import request from './request.js';

//Import players requests
//import players from './players.js';

//import authBot from '../main.js';

export enum PlayerDBOperationResults{
    Okay                = 0,
    DiscordIDExists     = 1,
    WGIDExists          = 2,
    NoBattles           = 3,
    PlayerNotFound      = 4,
}

export interface PlayerDBEntry {
    wgID: number,
    lastUpdated: number,
    region: region,
    player: PlayerStatsOverviewData,
    clan: PlayerClanData,
}

const playerUpdatePeriod = 43200000;

export class PlayerDB{
    private enmap: Enmap<Snowflake,PlayerDBEntry>;
    private debug: boolean;
    constructor(debug:boolean = false){
        this.debug = debug;
        if(debug){
            this.enmap = new Enmap<Snowflake,PlayerDBEntry>();
        } else {
            this.enmap = new Enmap<Snowflake,PlayerDBEntry>(`mainStorage`);
        }
    }

    public async setPlayer(wgID: number, realm:region, discordID:Snowflake): Promise<PlayerDBOperationResults>{
        //reject when DiscordID exists in the DB
        if(this.enmap.has(discordID)) throw 1;
        //reject when WargamingID is found in the DB
        if(this.enmap.exists('wgID', wgID)) throw 2;

        const player: Player = new Player(wgID, realm);

        const playerStats: PlayerStatsOverviewData = await player.statsOverview();

        // Null values indicates the players has no battles.
        if(!playerStats) throw 3


        const data: PlayerDBEntry = {
            wgID: wgID,
            lastUpdated : new Date().getTime(),
            region: realm,
            player: playerStats,
            clan: await player.clanData()
        };
        
        this.enmap.set(discordID, data);
        return 0;
    }

    public hasPlayer(discordID:Snowflake, wgID: number = 0): boolean{
        if (wgID === 0) return this.enmap.has(discordID) 
        else return this.enmap.has(discordID) || this.enmap.exists('wgID', wgID)
    }

    public async updateProfile(discordID: Snowflake): Promise<PlayerDBOperationResults>{
        let profile: PlayerDBEntry | undefined = this.enmap.get(discordID);
        if(!profile) throw 4

        const now: number = new Date().getTime();

        if(profile.lastUpdated + playerUpdatePeriod < now){
            const player: Player = new Player(profile.wgID, profile.region);
            const newPlayerStats: PlayerStatsOverviewData = await player.statsOverview();

            // Null values indicates the players has no battles.
            // Should not happen but just in case
            if(!newPlayerStats) throw 3 
            
            profile.player = newPlayerStats;
            profile.clan = await player.clanData();
            profile.lastUpdated = now;

            this.enmap.set(discordID, profile)
        }
        return 0;
    }
}