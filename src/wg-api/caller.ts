import { wgAPIReply, wgAPIQuery } from './interface';
import { request } from '../request'

import * as botSettings from '../../settings.json';

export class WGAPICaller {
    private readonly token: string;
    private readonly maximumAPITries: number;
    constructor(maximumAPITries: number = 3) {
        this.token = botSettings.wgAPIToken;
        this.maximumAPITries = maximumAPITries;
    }

    public async call<T>(fullURLPath: string, query: wgAPIQuery, post: boolean = true): Promise<wgAPIReply<T>> {
        //Attach a token regardless if it's used or not
        query.application_id = this.token;
        let res: any;
        for (let i = 0; i < this.maximumAPITries; i++) {
            try {
                const res: wgAPIReply<T> = await request<wgAPIReply<T>>(fullURLPath, {}, query);
                if (res.status === "ok") return res
            } catch (e) {
                if (i === this.maximumAPITries - 1) throw res
                //TODO log this as error
            }
        }
        throw res
    }
}
