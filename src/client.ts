import * as tls from 'tls'
import * as tcp from 'net'
import { Transform } from 'stream';
import log from 'standard-log'
import { readFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { createCipheriv, randomBytes, scrypt } from 'crypto';
const logger = log.getLogger('client');
// const remoteAddr = "127.0.0.1"
const remoteAddr = "www.apple.com"
const debug = true;
const ca = readFileSync('dist/cert/ca.crt');
const randomKey = "something";
enum connectionStatues {
    connectingFake,
    handshaking,
    connected
}
let status:connectionStatues = connectionStatues.connectingFake;
const createRealTlsClient = function(tcpSocket: tcp.Socket, oneTimeEncryptKey:string){
    const tlsHandshakeTransformer = new Transform();
    let iv = randomBytes(12);
    const encryption = createCipheriv('chacha20-poly1305',oneTimeEncryptKey,iv);
    tlsHandshakeTransformer._transform = (chunk,encoding,cb)=>{
        //do replace
        if(chunk[0]==22){//isHandshake
            encryption.write(chunk,encoding,(error)=>{

            });
        }
        tcpSocket.write(chunk,encoding,cb);
    }
    tcpSocket.on('data',(data)=>{
        //replace back 
        tlsHandshakeTransformer.emit('data',data);
    })
    const remoteTlsClientSocket = tls.connect({
        ca:ca,
        enableTrace:debug,
        socket:tlsHandshakeTransformer,
        rejectUnauthorized:true,
        ciphers:`ECDHE-ECDSA-AES256-GCM-SHA384`,
    },()=>{
        logger.info(`successfully connected to real remote`);
    });//for verification

}



const fakeClientInfo = {
    fakeDomain : "www.apple.com",
    ALPN : ['h2','http/1.1']
}
const remoteTcpSocket = tcp.connect({
    host:remoteAddr,
    port:443,
},()=>{
    const tcpSocketPipeAdaptor = new Transform();
    tcpSocketPipeAdaptor._transform = (chunk,encoding,cb)=>{
        remoteTcpSocket.write(chunk,encoding,cb);
    }
    remoteTcpSocket.on('data',(data)=>{
        tcpSocketPipeAdaptor.emit('data',data);
    })
    const remoteTlsClientSocket = tls.connect({
        enableTrace:debug,
        socket:tcpSocketPipeAdaptor,
        rejectUnauthorized:true,
        ALPNProtocols: fakeClientInfo.ALPN,
        servername: fakeClientInfo.fakeDomain,
        ciphers:`ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384`,
    },()=>{
        logger.info(`successfully connected to ${fakeClientInfo.fakeDomain}`);
    });//for verification
})
const realTlsClient = 0;