// Basic Discord.js Imports
import { Client, Snowflake, Guild, GuildMember, Message, Channel, User } from 'discord.js';

// Express for Identity Verification Subapp
import express, { Express } from 'express';

// Import Settings and various tokens
import { prefix, targetGuild, domain } from '../settings.json';
import { discordToken, localdebugging } from '../secrets.json'

import WGAPICaller from './wg-api/caller'

// Import Player Storage
import PlayerDB from './db'
import { DB, PlayerDBEntry, PlayerDBOperationResults } from './db';

// Import Region Data for assists
import { stringToRegion, region, regionData } from './region';

// WG API Callers
import Player from './player';
import { CWAEmbed, EmbedColor } from './embed';

import { wgAPIQuery } from './wg-api/interface';
import CWABotError from './error';
import Logger from './logger';
import { eqSet, sleep } from './util';

class CWABot extends Client {
    private readonly loginToken: string;
    public db: DB;
    public serverDomain: string;

    constructor() {
        super()
        this.loginToken = discordToken;
        this.db = PlayerDB;

        if (localdebugging) this.serverDomain = "localhost";
        else this.serverDomain = domain;

        // Chain On events here
        this.on("error", Logger.error);

        this.on("rateLimit", Logger.log)

        // Chuck Invite link to console 
        this.on("ready", () => {
            this.user.setPresence({
                game: {
                    name: `${prefix}help | wotbcw.asia`
                },
                status: 'online'
            })
        })

        // Message Handler (Commands and stuff)
        this.on("message", this.messageHandler)

        // Member Join Handler (new member joining)
        this.on("guildMemberAdd", async (member: GuildMember) => {
            if (!this.db.hasPlayer(member.id)) member.send("", await this.verifcationEmbed(member.user))
                .then(() => Logger.log(`sent verification link to ${member.user.username} (${member.id})`))
                .catch(Logger.error)
            this.memberUpdate(member)
        })

        // Periodic Updater (Timer Automated)
        this.setInterval(async () => {
            const fetchedGuild: Guild = await this.servingGuild.fetchMembers()
            const memberList: GuildMember[] = Array.from(fetchedGuild.members.array())
            for await (let member of memberList){
                await this.memberUpdate(member)
                await sleep(200)
            }
            Logger.log(`Periodic Updater, Checked nickname and role updates for ${memberList.length} members`)
        }, 1800000) // per 30 minutes
    }


    // Role and Nickname updater (to simplify things)
    private async memberUpdate(member: GuildMember): Promise<void>{
        if (!member.user.bot) {
            if (this.db.hasPlayer(member.id)) {
                const result = await this.db.updateProfile(member.id)
                if (result === PlayerDBOperationResults.Okay) {
                    await this.nicknameChange(member);
                }
            }
            await this.grantRoles(member);
        }
        return;
    }

    // Message Handler (for commands)
    private async messageHandler(message: Message): Promise<void> {
        // get user id in guild
        const guildUser: GuildMember | undefined = this.servingGuild.members.get(message.author.id)
        if (!guildUser) return;
        const rawMsg: string = message.cleanContent;

        const commandPartMsg: string = rawMsg.split(" ")[0]
        if (!commandPartMsg.startsWith(prefix)) return;

        const command: command | undefined = this.commandMap.get(commandPartMsg.replace(prefix, ''));
        if (!command) return;

        if (!command.permission(guildUser, this)) return;

        try {
            const embedReturn: CWAEmbed = await command.embedConstruct(message, this)

            if (command.forceReplyinPM) {
                guildUser.send('', embedReturn)
                    .then(() => Logger.log(`Executed ${command.name} and Sent PM for ${message.author.username} (${message.author.id})`))
                    .catch(() => {
                        const embed: CWAEmbed = new CWAEmbed(this)
                            .setColor(EmbedColor.Error)
                            .setDescription(`${this.user.username} Failed to send you Personal Messages. Please turn on "Allow direct messages from server members" option from "Privacy Settings"`)
                        message.reply('', { embed })
                        Logger.error(`Has Attempted to sent PM to ${message.author.username} (${message.author.id}), but has already notified about action.`)
                    })
            } else
                message.channel.send('', embedReturn)
                    .then(() => Logger.log(`Executed ${command.name} and Sent Reply for ${message.author.username} (${message.author.id})`))
        } catch (error) {
            const embed: CWAEmbed = new CWAEmbed(this).setColor(EmbedColor.Error)
            if (error instanceof CWABotError) {
                if (error.errorCode > 0) {
                    embed.setDescription(`**${error.returnError}**\n\n${error.returnrecommendation}`)
                        .addField("Debug Information: Stacktrace", error.stack)
                    message.channel.send('', embed)
                }
            }
            const fakeError = new CWABotError(0);
            embed.setDescription(`**${fakeError.returnError}**\n\n${fakeError.returnrecommendation}`)
                .addField("Debug Information: Stacktrace", error.stack)
            message.channel.send('', embed)
        }
    }

    private get commandMap(): Map<string, command> {
        return new Map(
            [
                ["verify", {
                    name: "Identity Verification Command",
                    command: "verify",
                    usage: `${prefix}verify`,
                    description: `Allows you to link your Wargaming Account with your Discord Account within ${this.user.setUsername}`,
                    async embedConstruct(d: Message, b: CWABot): Promise<CWAEmbed> {
                        return b.verifcationEmbed(d.author)
                    },
                    permission: (user: GuildMember, b: CWABot): boolean => {
                        return !this.db.hasPlayer(user.id) && !!b.servingGuild.members.get(user.id)
                    },
                    forceReplyinPM: true
                }]
            ]
        )
    }

    // Obtain the Guild Object that this bot is specifically serving, and return an error if the target guild is not found. 
    // Probably best to not catch this error since the bot relies on this to work.
    public get servingGuild(): Guild {
        const guild: Guild | undefined = this.guilds.get(targetGuild)

        // If the bot is not within the guide it is supposed to be in, throw an error that is not handled. let it crash in peace.
        if (!guild) throw "rippu crash"
        return guild;
    }

    // Start up Bot
    public async startBot(): Promise<void> {
        this.login(this.loginToken)
            .then(() => {
                Logger.log("Bot Login Successful!")
                return;
            })
    }

    private async verifcationEmbed(user: User): Promise<CWAEmbed> {
        const query: wgAuthQuery = {
            redirect_uri: `https://${this.serverDomain}${this.verificationApp.mountpath}ASIA/${user.id}/`,
            nofollow: 1
        }

        try {
            const redirectObject: any = (await WGAPICaller.call(`https://api.worldoftanks.asia/wot/auth/login/`, query)).data;
            if (!redirectObject.location) throw new CWABotError(1)
            const url: string = redirectObject.location

            const embed: CWAEmbed = new CWAEmbed(this)
                .setColor(EmbedColor.Basic)
                .setTitle(`${this.user.username}'s Player Verification Module`)
                .setDescription(`Login Via your Wargaming account to verify your in-game Identity!\n
                We only support verification of Asia server Account due to this being a Asia server based event.\n
                We do not have access to your account details as you are logging in via Wargaming's Portal, 
                which will only give us information about your Account ID and an Token which we will use to verify your identity.\n
                The link will expire after a certain amount of time.\n\n[Click Here To Verify!!](${url})`)
            return embed;

        } catch (e) { Logger.error(e) }
        throw new CWABotError(0);

    }

    // Role Grant (Hard-coded Roles ID)
    private async grantRoles(user: GuildMember): Promise<void> {
        // First grab a list of the player's current roles
        const playerEntry: PlayerDBEntry | undefined = this.db.get(user.id)

        // Generate a list of roles that are obtainable with this method (manual updates required!!)
        const roleHere: string[] =
            [CWARoles.Verified,
            CWARoles.ClanDeputies,
            CWARoles.ClanLeader,
            CWARoles.ClanMembers,
            CWARoles.Notification]
                // Change them into strings first (since we won't be needing them in enum form)
                .map(x => x.toString())

        // Then, make a new array where we will start stacking up roles that are for the user.
        const roleArray: CWARoles[] = [];

        if (playerEntry) {
            if (playerEntry.notificationRole) roleArray.push(CWARoles.Notification)
            // A verified player should have at least 10 battles.
            if (playerEntry.player.statistics.all.battles > 10) {
                // "Verified"
                roleArray.push(CWARoles.Verified);

                // Since this is CWA, Clan related checks
                if (playerEntry.clan) {

                    // Player is within a clan that has more than 10 members?
                    if (playerEntry.clan.clan.members_count > 10) {
                        // They are in a valid clan
                        // "Clan Member"
                        roleArray.push(CWARoles.ClanMembers);

                        // Is he a Clan leader?
                        if (playerEntry.clan.role === "commander")
                            // "Clan Leader"
                            roleArray.push(CWARoles.ClanLeader);

                        // Is he a clan deputy?
                        if (playerEntry.clan.role === "executive_officer")
                            // "Clan Deputies"
                            roleArray.push(CWARoles.ClanDeputies);
                    }

                }
            }

        } else {
            roleArray.push(CWARoles.Notification)
        }

        // Turn the roles into snowflakes
        let roleSFArray: string[] = roleArray.map(x => x.toString())

        // make a list of roles (from current user) that cannot be granted via this method and combine with list of roles granted right now.
        roleSFArray = roleSFArray.concat(user.roles.array().map(x => x.id).filter(x => roleHere.indexOf(x) === -1))
        // Update roles on the user
        if (!eqSet(new Set(roleSFArray), new Set(user.roles.array().map(x => x.id)))) user.setRoles(roleSFArray).catch(Logger.error);
    }

    private async nicknameChange(user: GuildMember): Promise<void> {
        const playerEntry: PlayerDBEntry | undefined = this.db.get(user.id)
        if (!playerEntry) return;
        if (!playerEntry.enforceNickname) return;


        let nickname: string;
        if (!playerEntry.clan)
            nickname = `${playerEntry.player.nickname}`
        else
            nickname = `${playerEntry.player.nickname} [${playerEntry.clan.clan.tag}]`

        // Add extra check to ensure it's not changing nickname even if it's the same 
        if (nickname === user.nickname) return
        user.setNickname(nickname).catch(Logger.error)
    }

    public readonly verificationApp: Express = express()
        .use(express.urlencoded({ extended: true }))
        .get('/:server/:discordID', (req, res) => {

            // Data Organization & Validation
            const query = req.query;
            const params = req.params;
            if (!params.server || !params.discordID || !query.status || !query.access_token || !query.nickname || !query.account_id || !query.expires_at) return res.status(400).send("400 Invalid Request to API Endpoint");


            const server: region | undefined = stringToRegion(params.server);
            const discordID: Snowflake = params.discordID;

            const user: GuildMember | undefined = this.servingGuild.members.get(discordID);

            if (!server || !user) return res.status(400).send("400 Bad Request");

            if (query.status !== "ok") return res.status(401).send("401 Unauthorized");
            // From here on in all the Data validation should be completed, and should only return error page only if token obtaining is unsuccessful.

            // now we've got everything, time to grab the access token (and verify it), 
            // not using the player ID directly (because the call can be made up and checking validity of token is more secure)
            // Changed strategy from token renewal to directly verifying with player request
            new Player(query.account_id, server, query.access_token).statsOverview()
                .then(async () => {
                    // If it's a validated player
                    const account_id = query.account_id;

                    if (this.db.hasPlayer(user.id, account_id)) return res.status(403).send("User has been registered")
                    await this.db.setPlayer(account_id, server, discordID);

                    this.grantRoles(user);
                    this.nicknameChange(user);

                    // Redirect them back to discord yay
                    return res.redirect("discord://discordapp.com/channels/401733517794476032/403393667101884416")
                    //return res.send("Your Player data and Discord account has now been linked. Your roles and nickname in the server will be updated shortly")
                })
                .catch(reply => {
                    Logger.log(reply)
                    return res.status(401).send("Illegal Access Token")
                })
        })
}

export const enum CWARoles {
    Council = "401743876752408586",
    Moderator = "401826604726222848",
    Umpire = "403393083825192971",
    MajorBlitzContributor = "401983395053436929",
    ClanLeader = "603936091560476683",
    ClanDeputies = "604240305624973323",
    ClanMembers = "604155231915343891",
    Verified = "603936154038829067",
    Notification = "608323805487824918"
}

export interface command {
    name: string,
    command: string,
    usage: string,
    description: string,
    embedConstruct(m: Message, b: CWABot): Promise<CWAEmbed>,
    permission(u: GuildMember, b: CWABot): boolean,
    forceReplyinPM: boolean,
}

interface wgAuthQuery extends wgAPIQuery {
    display?: "page" | "popup",
    expires_at?: number,
    nofollow?: 0 | 1,
    redirect_uri: string
}

export default new CWABot()
export { CWABot as CWAbot }