import express from 'express';
import path from 'path';

const webService = express();

webService.use(express.json());

webService.use((req, res, next) => {
    console.log(req.path)
    next();
})

webService.use(express.static(path.join(__dirname, "public")));

webService.all('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"))
});

export default webService