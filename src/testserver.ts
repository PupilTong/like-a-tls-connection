import { readFileSync } from "fs";
import * as tcp from 'net'
import { createLikeARealTlsServerSocket, likeARealTlsOption, createLikeARealTlsClient } from "./index.js";

const options:likeARealTlsOption = {
    oneTimeEncryptKey: "keyskeyskeyskeys",
    ivLength: 16,
    algorithm: "aes-128-gcm",
    tlsApplicationDataHeader: Buffer.from([0x17,0x03,0x03]),
    fakeDomain: "61.147.221.19",
    ca:readFileSync('dist/cert/ca.crt'),
    key:readFileSync('dist/cert/server.key'),
    cert:readFileSync('dist/cert/server.crt'),
    fakeALPN:['h2', 'http/1.1'],
    aad: "this is aad",
    authTagLength: 16
}
const tcpServer = tcp.createServer();
tcpServer.listen(8443,'localhost');
tcpServer.on('connection',(tcpSocket) =>{
    createLikeARealTlsServerSocket(tcpSocket, options).then(tlsSocket=>{
        tlsSocket.on('data',(data)=>{
            console.log(data);
        })
        tlsSocket.write("world");
    });
    // tcpServer.emit('connection')
})