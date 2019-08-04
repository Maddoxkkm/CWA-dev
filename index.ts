import express from 'express'
import CWABot from './botBackend/bot'

import path from 'path';

const main = express();

const cwabot = CWABot;

main.use((req, res, next) => {
    console.log(req.path)
    next();
})

main.use(express.static(path.join(__dirname, "public")))

main.all('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"))
})

main.use('/api/verify/', cwabot.verificationApp)
main.use((req, res, next) => res.redirect('/'))
main.listen(80)

cwabot.startBot();