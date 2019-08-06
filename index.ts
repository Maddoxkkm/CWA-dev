import CWABot from './botBackend/bot'

import webService from './webService/app'
import https from 'https'
import fs from 'fs'
import {localdebugging} from './settings.json'

import {sslcertLoc, sslkeyLoc} from './settings.json'

const cwabot = CWABot;

cwabot.startBot();

webService.use('/api/verify/', cwabot.verificationApp)
webService.use((req, res, next) => {res.sendStatus(404)})

if(!localdebugging){
    https.createServer({
        key: fs.readFileSync(sslkeyLoc),
        cert: fs.readFileSync(sslcertLoc)
    }, webService).listen(443)
        .on('tlsClientError', (err, socket) => console.error(err));
}

webService.listen(80)