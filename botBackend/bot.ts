// Basic Discord.js Imports
import { Client, Snowflake, Guild, GuildMember, Message, Channel, User } from 'discord.js';

// Express for Identity Verification Subapp
import express, { Express } from 'express';

// Import Settings and various tokens
import { debug, prefix, targetGuild, discordToken } from '../settings.json';

// Import Player Storage
import PlayerDB from './db'
import { DB, PlayerDBEntry, Language, PlayerDBOperationResults } from './db';

// Import Region Data for assists
import { stringToRegion, region, regionData } from './region';

// WG API Callers
import Player from './player';

export default class CWABot extends Client {
    private readonly loginToken: string;
    public db: DB;

    constructor() {
        // My settings, edit?
        super()
        this.loginToken = discordToken;
        this.db = PlayerDB;

        // Chain On events here
        this.on("error", console.error);

        // Chuck Invite link to console 
        this.on("ready", () => {
            this.generateInvite(["ADMINISTRATOR"])
                .then(link => `Link for the invite is ${link}`)
                .catch(console.error)
        })

        // Message Handler (Commands and stuff)
        this.on("message", this.messageHandler)

        // Player Updater (whenever they start typing will conduct an check)
        this.on("typingStart", (channel: Channel, user: User): void => {
            const guildUser: GuildMember | undefined = this.servingGuild.members.get(user.id);
            if (!guildUser) return;
            if (this.db.hasPlayer(guildUser.id)) this.db.updateProfile(guildUser.id).then(result => {
                if (result === PlayerDBOperationResults.Okay){
                    this.nicknameChange(guildUser);
                    this.grantRoles(guildUser);
                }
            })
        })

        // Member Join Handler (new member joining)
        //this.on("guildMemberAdd")
    }

    // Message Handler (for commands)
    private messageHandler(message: Message): void{
    }

    // Obtain the Guild Object that this bot is specifically serving, and return an error if the target guild is not found. 
    // Probably best to not catch this error since the bot relies on this to work.
    public get servingGuild(): Guild {
        const guild: Guild | undefined = this.guilds.get(targetGuild)

        // If the bot is not within the guide it is supposed to be in, throw an error that is not handled. let it crash in peace.
        if (!guild) throw "rippu crash"
        return guild;
    }

    public async startBot(): Promise<void> {
        this.login(this.loginToken)
            .then(() => {
                console.log("Bot Login Successful!")
                return;
            })
    }

    // Role Grant (Hard-coded Roles ID)
    // Require review (may possibly need better implementation)
    private grantRoles(user: GuildMember): void {
        const playerEntry: PlayerDBEntry | undefined = this.db.get(user.id)
        const roleHere: string[] =
            [CWARoles.Verified,
            CWARoles.ClanDeputies,
            CWARoles.ClanLeader,
            CWARoles.ClanMembers,
            CWARoles.English,
            CWARoles.Japanese]
                // Change them into strings first (since we won't be needing them in enum form)
                .map(x => x.toString())
        let roleArray: CWARoles[] = [];
        if (!playerEntry) return;

        if (playerEntry) {
            // A verified player should have at least 10 battles.
            if (playerEntry.player.statistics.all.battles > 10)
                // "Verified"
                roleArray.push(CWARoles.Verified);
            // If it's not a verified member don't even give role.
            else return;
            if (playerEntry.clan) {
                if (playerEntry.clan.clan.members_count > 10) {
                    // They are in a valid clan
                    // "Clan Member"
                    roleArray.push(CWARoles.ClanMembers);
                    if (playerEntry.clan.role === "commander")
                        // "Clan Leader"
                        roleArray.push(CWARoles.ClanLeader);
                    if (playerEntry.clan.role === "executive_officer")
                        // "Clan Deputies"
                        roleArray.push(CWARoles.ClanDeputies);
                }

            }

            switch (playerEntry.language) {
                case Language.EN:
                    // "English"
                    roleArray.push(CWARoles.English);
                    break;
                case Language.JP:
                    // "Japanese"
                    roleArray.push(CWARoles.Japanese);
                    break;
            }
        }

        // Turn the roles into snowflakes
        let roleSFArray: string[] = roleArray.map(x => x.toString())
        const roleHereSF: string[] = roleHere.map(x => x.toString())

        // make a list of roles (from current user) that cannot be granted via this method and combine with list or roles granted right now.
        roleSFArray = roleSFArray.concat(user.roles.array().map(x => x.id).filter(x => roleHere.indexOf(x) === -1))
        // Update roles on the user
        user.setRoles(roleSFArray).catch(console.error);
    }

    private nicknameChange(user: GuildMember): void {
        const playerEntry: PlayerDBEntry | undefined = this.db.get(user.id)
        if (!playerEntry) return;
        if (!playerEntry.enforceNickname) return;

        try {
            if (!playerEntry.clan)
                user.setNickname(`${playerEntry.player.nickname}`).catch(console.error)
            else user.setNickname(`${playerEntry.player.nickname} [${playerEntry.clan.clan.tag}]`).catch(console.error)
        } catch (error) { console.log(error) }
        return;
    }

    public get verificationApp(): Express {
        const verifyApp = express();
        verifyApp.use(express.urlencoded({ extended: true }));
        verifyApp.get('/:server/:discordID', (req, res) => {

            // Data Organization & Validation
            const query = req.query;
            const params = req.params;
            if (!params.server || !params.discordID || !query.status || !query.access_token || !query.nickname || !query.account_id || !query.expires_at)
                return res.status(400).send("400 Invalid Request to API Endpoint");

            const server: region | undefined = stringToRegion(params.server);
            const discordID: Snowflake = params.discordID;

            const user: GuildMember | undefined = this.servingGuild.members.get(discordID);

            if (!server || !user)
                return res.status(400).send("400 Bad Request");

            const servData = regionData[server];
            if (query.status !== "ok")
                return res.status(401).send("401 Unauthorized");
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
        return verifyApp;
    }
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
    English = "604156450280964097",
    Japanese = "604156451744776208"
}

