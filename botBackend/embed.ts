import { RichEmbed } from "discord.js";
import { CWAbot } from "./bot";

export class CWAEmbed extends RichEmbed {
    private bot: CWAbot;
    constructor(bot: CWAbot) {
        super()
        this.bot = bot;
        this.setAuthor(bot.user.username, bot.user.avatarURL);
    }
}


export enum EmbedColor {
    Basic = 3097087
}