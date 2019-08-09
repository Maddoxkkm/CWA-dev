import { WebhookClient } from "discord.js";
import { loggingWebhook } from "../secrets.json"

class Logger extends WebhookClient {
    constructor(){
        super(loggingWebhook.id, loggingWebhook.token)
    }

    public error = (message?: any, ...optionalParams: any[]): void => {
        this.send(`\`${message} ${optionalParams.join(" ")}\``)
        console.error(message, optionalParams)
    }

    public log = (message?: any, ...optionalParams: any[]): void => {
        this.send(`\`${message} ${optionalParams.join(" ")}\``)
        console.log(message, ...optionalParams)
    }
}

export default new Logger()