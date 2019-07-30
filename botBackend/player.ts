import WGAPICaller from './wg-api/caller'
import { wgAPIReply, playerClanQuery, playerOverviewQuery, PlayerClanData, PlayerStatsOverviewData, PlayerStatsOverviewDataStroage, PlayerClanDataStorage } from './wg-api/interface'
import { region, regionData } from './region'

// Player class that only accepts playerID and realm 
export default class Player {
    public readonly realm: region;
    public readonly userID: number;
    private readonly token: string | undefined;

    constructor(userID: number, realm?: region, token?: string) {
        this.realm = realm ? realm : this.getRealm(userID)
        this.userID = userID;
        this.token = token
    }

    private getRealm(userID: number): region {
        if (userID < 500000000) {
            return region.RU;
        }
        if (userID < 1000000000) {
            return region.EU;
        }
        if (userID < 2000000000) {
            return region.NA;
        }
        return region.ASIA;
    }

    public async statsOverview(): Promise<PlayerStatsOverviewData | undefined> {
        const apiUrl = regionData[this.realm].apiDomainName
        const query: playerOverviewQuery = {
            account_id: this.userID,
            fields: '-statistics.clan, -statistics.frags, -private',
            language: 'en'
        }
        if (this.token) query.access_token = this.token;
        const result: wgAPIReply<PlayerStatsOverviewDataStroage> = await WGAPICaller.call<PlayerStatsOverviewDataStroage>(`http://${apiUrl}/wotb/account/info/`, query)
      
        const final: undefined | PlayerStatsOverviewData = result.data[this.userID] ? result.data[this.userID] : undefined
        if (!final) {
            return undefined;
        }
        return final;
    }

    public async clanData(): Promise<PlayerClanData | undefined> {
        const apiUrl = regionData[this.realm].apiDomainName
        const query: playerClanQuery = {
            account_id: this.userID,
            extra: 'clan',
            language: 'en'
        }
        const result: wgAPIReply<PlayerClanDataStorage> = await WGAPICaller.call<PlayerClanDataStorage>(`http://${apiUrl}/wotb/clans/accountinfo/`, query)
        const final: undefined | PlayerClanData = result.data[this.userID] ? result.data[this.userID] : undefined
        //console.log(final)
        if (!final || !final.clan || !final.clan.clan_id) {
            return undefined;
        }
        return final;
    }
}

//new Player(2006665991).statsOverview().then(x => console.log(x))
//new Player(2005957232).clanData().then(x => console.log(x))