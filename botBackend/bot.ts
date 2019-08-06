// Basic Discord.js Imports
import { Client, Snowflake, Guild, GuildMember, Message, Channel, User } from 'discord.js';

// Express for Identity Verification Subapp
import express, { Express } from 'express';

// Import Settings and various tokens
import { debug, prefix, targetGuild, discordToken, domain, localdebugging } from '../settings.json';

import WGAPICaller from './wg-api/caller'

// Import Player Storage
import PlayerDB from './db'
import { DB, PlayerDBEntry, PlayerDBOperationResults } from './db';

// Import Region Data for assists
import { stringToRegion, region, regionData } from './region';

// WG API Callers
import Player from './player';
import { CWAEmbed, EmbedColor } from './embed';
import { wgAPIQuery } from './wg-api/interface.js';

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
        this.on("error", console.error);

        // Chuck Invite link to console 
        this.on("ready", () => {
            this.generateInvite(["ADMINISTRATOR"])
                .then(link => console.log(`Link for the invite is ${link}`))
                .catch(console.error)
            // this.user.setAvatar(this.servingGuild.iconURL)
            //     .then(() => console.log('Logo Update Successful!'))
            //     .catch(console.error)
        })

        // Message Handler (Commands and stuff)
        this.on("message", this.messageHandler)

        // Player Updater (whenever they start typing will conduct an check)
        this.on("typingStart", (channel: Channel, user: User): void => {
            const guildUser: GuildMember | undefined = this.servingGuild.members.get(user.id);
            if (!guildUser) return;
            if (this.db.hasPlayer(guildUser.id)) this.db.updateProfile(guildUser.id).then(result => {
                if (result === PlayerDBOperationResults.Okay) {
                    this.nicknameChange(guildUser);
                    this.grantRoles(guildUser);
                }
            })
        })

        // Member Join Handler (new member joining)
        //this.on("guildMemberAdd")
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

        return command.do(message, this)

    }

    private get commandMap(): Map<string, command> {
        return new Map(
            [
                ["verify", {
                    name: "Identity Verification Command",
                    command: "verify",
                    usage: `${prefix}verify`,
                    description: `Allows you to link your Wargaming Account with your Discord Account within ${this.user.setUsername}`,
                    async do(d: Message, b: CWABot): Promise<void> {
                        b.sendVerification(d.member)
                    },
                    permission: (user: GuildMember, b: CWABot): boolean => {
                        return !this.db.hasPlayer(user.id) && !!b.servingGuild.members.get(user.id)
                    }
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
                console.log("Bot Login Successful!")
                return;
            })
    }

    private async sendVerification(user: GuildMember): Promise<void> {
        const query: wgAuthQuery = {
            redirect_uri: `https://${this.serverDomain}${this.verificationApp.mountpath}ASIA/${user.user.id}/`,
            nofollow: 1
        }

        try {
            const redirectObject: any = (await WGAPICaller.call(`https://api.worldoftanks.asia/wot/auth/login/`, query)).data;
            if (!redirectObject.location) return;
            const url: string = redirectObject.location

            const embed: CWAEmbed = new CWAEmbed(this)
                .setColor(EmbedColor.Basic)
                .setTitle(`${this.user.username}'s Player Verification Module`)
                .setDescription(`Login Via your Wargaming account to verify your in-game Identity!\n
                We only support verification of Asia server Account due to this being a Asia server based event.\n
                We do not have access to your account details as you are logging in via Wargaming's Portal, 
                which will only give us information about your Account ID and an Token which we will use to verify your identity.\n
                The link will expire after a certain amount of time.\n\n[Click Here To Verify!!](${url})`)

            user.send('', embed).then(() => console.log(`sent verification link to ${user.user.username} (${user.id})`)).catch(console.error)
            return;

        } catch (e) { console.error(e) }



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
        user.setRoles(roleSFArray).catch(console.error);
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
        user.setNickname(nickname).catch(console.error)
    }

    public readonly verificationApp: Express =
        express()
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

                const servData = regionData[server];
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

                        return res.send("Your Player data and Discord account has now been linked. Your roles and nickname in the server will be updated shortly")
                    })
                    .catch(reply => {
                        console.log(reply)
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
    do(m: Message, b: CWABot): Promise<void>,
    permission(u: GuildMember, b: CWABot): boolean
}

interface wgAuthQuery extends wgAPIQuery {
    display?: "page" | "popup",
    expires_at?: number,
    nofollow?: 0 | 1,
    redirect_uri: string
}

export default new CWABot()
export { CWABot as CWAbot }