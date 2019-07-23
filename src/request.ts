import Axios, {AxiosResponse} from 'axios';
import {stringify} from "qs";

// not-so-basic-anymore warpper for both post and get requests :))
export async function request<T>(url:string, query?:any, reqBody?:any):Promise<T>{
    const queryUrl = query ? url + "?" + stringify(query) : url
    const res = reqBody ? await Axios.post<T>(queryUrl, stringify(reqBody)) : await Axios.get<T>(queryUrl)

    //http code is 400~599 so it's either our fault or server fault
    if(res.status >= 400 && res.status <= 599) throw res

    //well if it's not 400~599 it's likely to be an 'ok'
    else return res.data;
}

// example (get with query)
// request<wgAPIReply>("https://api.wotblitz.asia/wotb/clans/list/", {application_id: "", search: "FEAST"}).then(x => console.log(x))

// example (post)
// request("https://api.wotblitz.asia/wotb/clans/list/", {}, {application_id: "", search: "FEAST"}).then(x => console.log(x))

// example (post specific api)
// request("https://api.worldoftanks.asia/wot/auth/prolongate/", {}, {application_id: "", access_token: "12381769asfkjnbkdaskd"}).then(x => console.log(x))

// example (get)
//request("https://api.wotblitz.asia/wotb/clans/list/?application_id=&search=FEAST").then(x => console.log(x))
