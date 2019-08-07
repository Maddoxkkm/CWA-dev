import express from 'express';
import path from 'path';

import Logger from "../botBackend/logger"

const webService = express();

webService.use(express.json());

webService.use((req, res, next) => {
    res.on("finish", () => {
        if (res.statusCode !== 404) {Logger.log(`HTTP: "${req.baseUrl ? req.baseUrl + req.path : req.path}", ip: ${req.ip}, time: ${new Date().toUTCString()}`)}
    })
    next();
})

webService.use(express.static(path.join(__dirname, "public")));

webService.all('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"))
    res.end()
});

export default webService