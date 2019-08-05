import CWABot from './botBackend/bot'

import webService from './webService/app'
import https from 'https'
import fs from 'fs'

import {sslcertLoc, sslkeyLoc} from './settings.json'

const cwabot = CWABot;

cwabot.startBot();

webService.use('/api/verify/', cwabot.verificationApp)
webService.use((req, res, next) => res.redirect('/'))

https.createServer({
    key: fs.readFileSync(sslkeyLoc),
    cert: fs.readFileSync(sslcertLoc)
}, webService).listen(443)
    .on('tlsClientError', (err, socket) => console.error(err));
webService.listen(80)