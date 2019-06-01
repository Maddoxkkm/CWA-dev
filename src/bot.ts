import * as discord from 'discord.js';

const discordBot = new discord.Client({
    messageCacheLifetime: 60,
    messageSweepInterval:400,
    messageCacheMaxSize:10,
    disabledEvents: ["TYPING_START"]
});

const prefix = 'cw!';
const commandInvoke = '-';

export class CWABot{
    constructor(token:string){
        
    }
}