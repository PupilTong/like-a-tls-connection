import { networkInterfaces } from "os";
import { Duplex } from "stream";
import {TLSSocket, createSecureContext} from 'tls'
import {createServer as createTcpServer,createConnection as createTcpConn} from 'net'

const fakeDomain  = 'www.microsoft.com';

const secureContext = createSecureContext();

const tcpServer = createTcpServer((socket)=>{
    const prxoyToRealSiteSocket = createTcpConn(443,fakeDomain,)
    const tlsSocket = new TLSSocket(socket,{
        enableTrace:true,
        isServer: true,
        requestCert:false,
        rejectUnauthorized:false,
        SNICallback:(sni)=>{
        },
        secureContext: secureContext

    },)
});
export {}
