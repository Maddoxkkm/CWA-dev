import Axios, {AxiosResponse} from 'axios';

//very basic warpper, since we are not using request library anymore, but just here for the sake of simplicity.
export async function request(url:string):Promise<any>{
    const res = await Axios.get(url);
    
    //http code is 400~599 so it's either our fault or server fault
    if(res.status >= 400 && res.status <= 599) throw res

    //well if it's not 400~599 it's likely to be an 'ok'
    else return res.data;
}