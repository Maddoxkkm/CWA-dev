import { WebhookClient } from "discord.js";
import { loggingWebhook } from "../secrets.json"

class Logger extends WebhookClient {
    constructor(){
        super(loggingWebhook.id, loggingWebhook.token)
    }

    public error(e: string): void{
        this.send(`\`${e}\``)
        console.error(e)
    }

    public log(...args: string[]): void{
        this.send(`\`${args.join(" ")}\``)
        console.log(args)
    }
}

export default new Logger()