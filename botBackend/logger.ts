import { WebhookClient } from "discord.js";
import { loggingWebhook } from "../secrets.json"

class Logger extends WebhookClient {
    constructor(){
        super(loggingWebhook.id, loggingWebhook.token)
    }

    public error = (message?: any, ...optionalParams: any[]): void => {
        let string = '';
        if( typeof message === "object"){
            string += JSON.stringify(message)
        } else {
            string += message
        }
        optionalParams.map( item => {
            if( typeof item === "object"){
                string += "\n" + JSON.stringify(item) 
            } else {
                string += item
            }
        })
        this.send(`\`${string}\``)
        console.error(message, optionalParams)
    }

    public log = (message?: any, ...optionalParams: any[]): void => {
        let string = '';
        if( typeof message === "object"){
            string += JSON.stringify(message)
        } else {
            string += message
        }
        optionalParams.map( item => {
            if( typeof item === "object"){
                string += "\n" + JSON.stringify(item) 
            } else {
                string += item
            }
        })
        this.send(`\`${string}\``)
        console.log(message, ...optionalParams)
    }
}

export default new Logger()