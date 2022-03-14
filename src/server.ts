import {TLSSocket, createSecureContext} from 'tls'
import {createServer as createTcpServer,createConnection as createTcpConn} from 'net'
import { PassThrough } from "stream";

const fakeDomain  = 'www.microsoft.com';

const secureContext = createSecureContext();

const tcpServer = createTcpServer((socket)=>{
    const socketForRemote = socket.pipe(new PassThrough());
    const prxoyToRemoteSiteSocket = createTcpConn(443,fakeDomain,()=>{
        socket.on('data',(data)=>{

        })
        socketForRemote.pipe(prxoyToRemoteSiteSocket);
    })

    const socketForLocal = socket.pipe(new PassThrough());
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
