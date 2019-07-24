export interface wgAPIReply<T> {
    status: 'ok' | 'error',
    //this will only exist in case of error
    data: T,
    error?: {
        message: string,
        code: number,
        value: string
    }
}

// we will extend the interface if needed
export interface wgAPIQuery {
    // reason this is optional is because when you create it, it doesn't have to input anything
    application_id?: string
}

export type PlayerClanDataStorage = {
    readonly [playerID in number]?: PlayerClanData
}

export type PlayerClanData = {
    clan: {
        members_count: number,
        name: string,
        created_at: number,
        tag: string,
        clan_id: number,
        emblem_set_id: number
    },
    account_id: number,
    joined_at: number,
    clan_id: number,
    role: "commander" | "private" | "executive_officer",
    account_name: string
}

export type PlayerStatsOverviewDataStroage = {
    readonly [playerID in number]?: PlayerStatsOverviewData
}

export type PlayerStatsOverviewData = {
    statistics: {
        all: {
            spotted: number,
            max_frags_tank_id: number,
            hits: number,
            frags: number,
            max_xp: number,
            max_xp_tank_id: number,
            wins: number,
            losses: number,
            capture_points: number,
            battles: number,
            damage_dealt: number,
            damage_received: number,
            max_frags: number,
            shots: number,
            frags8p: number,
            xp: number,
            win_and_survived: number,
            survived_battles: number,
            dropped_capture_points: number
        }
    },
    account_id: number,
    created_at: number,
    updated_at: number,
    last_battle_time: number,
    nickname: string
}

export interface playerOverviewQuery extends wgAPIQuery {
    account_id: number,
    access_token?: string,
    extra?: string,
    fields?: string,
    language?: string
}

export interface playerClanQuery extends wgAPIQuery {
    account_id: number,
    extra?: string,
    fields?: string,
    language?: string
}