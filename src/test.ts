import { readFileSync } from "fs";
import * as tcp from 'net'
import { activateLikeARealTlsServer, likeARealTlsOption, createLikeARealTlsClient } from "./index.js";

const tcpServer = tcp.createServer();
tcpServer.listen(8443,'localhost');
const options:likeARealTlsOption = {
    oneTimeEncryptKey: "test",
    ivLength: 16,
    algorithm: "chacha20-poly1305",
    tlsApplicationDataHeader: Buffer.from([0x17,0x03,0x03]),
    fakeDomain: "www.apple.com",
    ca:readFileSync('dist/cert/ca.crt'),
    key:readFileSync('dist/cert/server.key'),
    cert:readFileSync('dist/cert/server.crt'),
    fakeALPN:['h2', 'http/1.1'],
    tcpServer:tcpServer
}
activateLikeARealTlsServer(options);
const tcpSocket = tcp.createConnection(8443,'localhost',()=>{
    options.tcpSocket = tcpSocket;
    createLikeARealTlsClient(options);
})