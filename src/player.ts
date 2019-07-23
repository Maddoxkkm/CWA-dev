import {WGAPICaller} from './wg-api/caller'
import {wgAPIReply, playerClanQuery, playerOverviewQuery, PlayerClanData, PlayerStatsOverviewData, PlayerStatsOverviewDataStroage, PlayerClanDataStorage} from './wg-api/interface'
import {region, regionData} from './region'

const apicaller = new WGAPICaller();

// Player class that only accepts playerID and realm 
export class Player {
    public readonly realm: region;
    public readonly userID: number;

    constructor(userID: number, realm?:region){
        this.realm = realm ? realm : this.getRealm(userID)
        this.userID = userID;
    }

    private getRealm(userID: number): region{
        if(userID < 500000000){
            return region.RU;
        }
        if(userID < 1000000000){
            return region.EU;
        }
        if (userID < 2000000000) {
            return region.NA;
        }
        return region.ASIA;
    }

    public async statsOverview(): Promise<PlayerStatsOverviewData>{
        const apiUrl = regionData[this.realm].apiDomainName
        const query: playerOverviewQuery = {
            account_id: this.userID,
            fields: '-statistics.clan, -statistics.frags, -private',
            language: 'en'
        }
        const result: wgAPIReply<PlayerStatsOverviewDataStroage> = await apicaller.call<PlayerStatsOverviewDataStroage>(`http://${apiUrl}/wotb/account/info/`,query)
        const final: undefined | PlayerStatsOverviewData = result.data[this.userID] ? result.data[this.userID] : undefined
        if(!final){
            throw 1;
        }
        return final;
    } 

    public async clanData(): Promise<PlayerClanData>{
        const apiUrl = regionData[this.realm].apiDomainName
        const query: playerClanQuery = {
            account_id: this.userID,
            extra: 'clan',
            language: 'en'
        }
        const result: wgAPIReply<PlayerClanDataStorage> = await apicaller.call<PlayerClanDataStorage>(`http://${apiUrl}/wotb/clans/accountinfo/`,query)
        const final: undefined | PlayerClanData = result.data[this.userID] ? result.data[this.userID] : undefined
        if(!final){
            throw 1;
        }
        console.log(final.clan)
        return final;
    }
}

new Player(2006665991).statsOverview().then(x=>console.log(x))
new Player(2006665991).clanData().then(x=>console.log(x))