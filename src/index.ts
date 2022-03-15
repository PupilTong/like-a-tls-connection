import {createLikeARealTlsClient} from './client'
import {activateLikeARealTlsServer} from './server'
import * as tcp from 'net'


interface likeARealTlsOption {
    tcpSocket?: tcp.Socket,
    tcpServer?:tcp.Server
    oneTimeEncryptKey: string,
    ivLength: number,
    algthroim: string,
    tlsApplicationDataHeader:string,
    fakeDomain:string,
    fakeALPN?: string[],
    ca:Buffer,
    key?:Buffer,
    cert?:Buffer
}

export {likeARealTlsOption,createLikeARealTlsClient, activateLikeARealTlsServer}