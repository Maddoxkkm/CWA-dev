import {Client} from 'discord.js';
import { WGAPICaller } from './wg-api/caller';


const discordBot = new Client({
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