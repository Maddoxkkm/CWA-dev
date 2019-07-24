import { request } from './src/request'

const test = request('https://api.worldoftanks.asia/wgn/servers/info/?application_id=71df07a3f5c764028c167d09eec0cd99')
    .then(x => console.log(x))

console.log('Hello World!!')