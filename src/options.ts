
import * as tcp from 'net'
interface likeARealTlsOption {
    tcpSocket?: tcp.Socket,
    tcpServer?:tcp.Server
    oneTimeEncryptKey: string,
    ivLength: number,
    algorithm: string,
    tlsApplicationDataHeader:Buffer,
    fakeDomain:string,
    fakeALPN?: string[],
    ca:Buffer,
    key?:Buffer,
    cert?:Buffer
}
export {likeARealTlsOption}