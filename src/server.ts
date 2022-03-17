import * as tls from "tls";
import * as tcp from "net";
import { Duplex, Transform } from "stream";
import { likeARealTlsOption, encryptDataAndAppendFakeHeader, decryptDataAndRemoveFakeHeader } from "./common.js";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import log from "standard-log";
const logger = log.getLogger("server");

// const fakeDomain  = 'www.microsoft.com';
const debug = true;
const createLikeARealTlsServerSocket = (
    tcpSocketToClient: tcp.Socket,
    options: likeARealTlsOption
): Promise<tls.TLSSocket> => {
    return new Promise<tls.TLSSocket>((resolve, reject) => {
        const ca = options.ca;
        const cert = options.cert;
        const key = options.key;
        const fakeDomain = options.fakeDomain;
        const algorithm = options.algorithm;
        const oneTimeEncryptKey = options.oneTimeEncryptKey;
        const ivLength = options.ivLength;
        const fakeHeader = options.tlsApplicationDataHeader;
        enum connectionStatues {
            handshaking,
            connected,
        }
        let status = connectionStatues.handshaking;

        const createTcpSocketToFake = (domain: string, port: number): Promise<tcp.Socket> => {
            return new Promise<tcp.Socket>((resolve, reject) => {
                const tcpSocketToFake = tcp.connect({
                    host: domain,
                    port: port,
                });
                tcpSocketToFake.on("connect", () => {
                    resolve(tcpSocketToFake);
                });
                tcpSocketToFake.on("error", (err) => {
                    logger.error(`cannot connect to fake Server ${fakeDomain}, Error:${err}`);
                    reject(tcpSocketToFake);
                });
            });
        };


        // tcpSocketToClient.on("connect", () => {
        logger.info(`got a tcp connection : ${tcpSocketToClient.remoteAddress}:${tcpSocketToClient.remotePort}`);
        createTcpSocketToFake(fakeDomain, 443).then((tcpSocketToFake) => {
            const localStreamToTlsServer = new Transform();
            const realTlsSocket = new tls.TLSSocket(localStreamToTlsServer as any, {
                ca: ca,
                cert: cert,
                key: key,
                ciphers: `ECDHE-ECDSA-AES256-GCM-SHA384`,
                enableTrace: debug,
                isServer: true,
            });
            tcpSocketToFake.on("data", (data) => {
                // data from fake server
                if (status === connectionStatues.handshaking) {
                    tcpSocketToClient.write(data);
                }
            });

            tcpSocketToClient.on("data", async (data) => {
                // data from client
                if (status === connectionStatues.handshaking && !(realTlsSocket.getFinished())) {
                    decryptDataAndRemoveFakeHeader(data, fakeHeader, algorithm, oneTimeEncryptKey, ivLength)
                    .then((decryptedData) => {
                        logger.info(`received packet :${decryptedData.length} bytes`)
                        localStreamToTlsServer.emit("data", decryptedData);
                    },(err)=>{
                        logger.info(`forwarded ${data.length} bytes to fake server, Error :${err}`)
                        tcpSocketToFake.write(data);
                    })
                } else  {
                    logger.info(`real tls connection established`);
                    resolve(realTlsSocket);
                    status = connectionStatues.connected;
                    localStreamToTlsServer.emit("data", data);
                }
            });

            localStreamToTlsServer._transform = (data, encoding, cb) => {
                //data from tls server
                if (status === connectionStatues.handshaking) {
                    encryptDataAndAppendFakeHeader(data, fakeHeader, algorithm, oneTimeEncryptKey, ivLength)
                    .then((encryptedData) => {
                        tcpSocketToClient.write(encryptedData, encoding, cb);
                    },(err)=>{
                        logger.emergency(`err: ${err} : cannot encrypt data : ${data.toString('hex')}`)
                    });
                } else if (status === connectionStatues.connected) {
                    tcpSocketToClient.write(data, encoding, cb);
                }
            };

            //error handler
            tcpSocketToFake.on('error',(err)=>{
                if(status === connectionStatues.handshaking){
                    tcpSocketToClient.emit('error',err);
                }
                else{
                    logger.info(`socket to remote fake server closed : ${err}`)
                }
            });
            tcpSocketToClient.on('error',(err)=>{
                logger.emergency(`client socket error :${err}`);
                tcpSocketToFake.destroy();
                localStreamToTlsServer.emit('error', err);
            })
        });
        // });
    });
};
export { createLikeARealTlsServerSocket };
