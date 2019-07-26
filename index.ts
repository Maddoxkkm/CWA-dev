import express = require("express");

import { regionData, region, stringToRegion } from './botBackend/region'
import { Snowflake } from "discord.js";

const main = express();

import CWABot from './botBackend/bot'

const cwabot = new CWABot();

main.use((req, res, next) => {
    console.log(req.path)
    next();
})

main.use('/api/verify/', cwabot.verificationApp)
main.listen(3000)

cwabot.startBot();