import { Client, Snowflake, Guild } from 'discord.js';
import { WGAPICaller } from './wg-api/caller';
import * as http from 'http';
import * as url from 'url';

const prefix = 'cw!';
const commandInvoke = '-';
const targetGuild = '401733517794476032';

export class CWABot extends Client {
    private readonly loginToken: string;
    constructor(loginToken: string) {
        // My settings, edit?
        super({
            messageCacheLifetime: 60,
            messageSweepInterval: 400,
            messageCacheMaxSize: 10,
            disabledEvents: ["TYPING_START"]
        })
        this.loginToken = loginToken;
        // Chain On events here
        this.on("error", e => console.log(e));

        this.startBot().then(() => {
            //post login actions

        })
    }

    public get servingGuild(): Guild {
        const guild: Guild | undefined = this.guilds.get(targetGuild)

        // If the bot is not within the guide it is supposed to be in, throw an error that is not handled. let it crash in peace.
        if (!guild) throw "rippu crash"
        return guild;
    }

    private async startBot(): Promise<void> {
        this.login(this.loginToken)
            .then(() => {
                console.log("Bot Login Successful!")
                return;
            })
    }
}