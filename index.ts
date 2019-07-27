import express = require("express");

const main = express();

import CWABot from './botBackend/bot'

const cwabot = new CWABot();

main.use((req, res, next) => {
    console.log(req.path)
    next();
})

main.all('/', (req, res) =>{
    res.send("Welcome to CWA Homepage, the site is currently under construction.")
})

main.use('/api/verify/', cwabot.verificationApp)
main.use((req, res, next) => res.redirect('/'))
main.listen(3000)

cwabot.startBot();