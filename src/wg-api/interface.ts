// we will extend the interface if needed
export interface wgAPIReply {
    status: 'ok' | 'error',
    //this will only exist in case of error
    error?: {
        message: string,
        code: number,
        value: string
    }
}
