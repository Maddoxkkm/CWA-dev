import CWABot from './botBackend/bot'

import webService from './webService/app'

const cwabot = CWABot;

cwabot.startBot();

webService.use('/api/verify/', cwabot.verificationApp)
webService.use((req, res, next) => res.redirect('/'))
webService.listen(80)