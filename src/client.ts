import * as tls from 'tls'
import * as tcp from 'net'
import { Duplex, Transform } from 'stream';
import { likeARealTlsOption, encryptDataAndAppendFakeHeader, decryptDataAndRemoveFakeHeader } from './common.js';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import log from 'standard-log'
import { TcpNetConnectOpts } from 'net';
import { removeAllListeners } from 'process';
const logger = log.getLogger('client');
const debug = false;
//'chacha20-poly1305'
const createLikeARealTlsClient = (port:number, host:string, options : likeARealTlsOption) : Promise<tls.TLSSocket> => {
    return new Promise<tls.TLSSocket>((resolve,reject)=>{
        const ca = options.ca;
        const fakeALPN = options.fakeALPN;
        const fakeDomain = options.fakeDomain;
        const tlsApplicationDataHeader = options.tlsApplicationDataHeader;
        const algorithm = options.algorithm;
        const oneTimeEncryptKey = options.oneTimeEncryptKey;
        const ivLength = options.ivLength;
        enum connectionStatues {
            connectingFake,
            handshaking,
            connected
        }
        let status = connectionStatues.connectingFake;
        const doTcpConnect = (port:number, host:string) : Promise<tcp.Socket> =>{
            return new Promise<tcp.Socket>((resolve, reject)=>{
                const tcpSocket = tcp.connect(port,host,()=>{
                    logger.info(`established tcp connection to ${host}, local port ${tcpSocket.localPort}`);
                    // tcpSocket.removeAllListeners('error');
                    resolve(tcpSocket);
                });
                tcpSocket.on('error',(err)=>{
                    logger.info(`tcp connection error : ${err}`);
                    reject(err);
                })
            })
        }
        const doHandshakeToFake  = (fakeDomain : string, tcpSocket: Duplex, alpn : string[]) : Promise<tls.TLSSocket> => {
            return new Promise((resolve,reject)=>{
                const tlsToFake = tls.connect({
                    enableTrace: debug,
                    socket: tcpSocket,
                    rejectUnauthorized: true,
                    ALPNProtocols: alpn,
                    servername: fakeDomain,
                }, () => {
                    logger.info(`successfully connected to fake remote ${fakeDomain}`);
                    // tlsToFake.removeAllListeners('error');
                    resolve(tlsToFake);
                });
                tlsToFake.on('error',(err)=>{
                    logger.error(`failed to connect to fake remote ${fakeDomain} : Error ${err}`);
                    reject(err);
                })
            })
        }

        const doRealHandshake = (tcpSocket:Duplex, ca: Buffer) : Promise<tls.TLSSocket> =>{
            return new Promise((resolve,reject)=>{
                const realTlsSocket = tls.connect({
                    ca: ca,
                    enableTrace: debug,
                    socket: tcpSocket,
                    rejectUnauthorized: true,
                    ciphers: `ECDHE-ECDSA-AES256-GCM-SHA384`,
                }, () => {
                    logger.info(`successfully connected to real remote`);
                    // realTlsSocket.removeAllListeners('error')
                    resolve(realTlsSocket);
                });
                realTlsSocket.on('error',(err)=>{
                    reject(err);
                })
            })
        }

        doTcpConnect(port,host).then((tcpSocket)=>{
            const tcpMuxTransformForFake = new Transform();
            const tcpMuxTransformForReal = new Transform();
            tcpMuxTransformForFake._transform = (chunk,encoding,cb)=>{
                //fake tls  ====> tcp
                if(status === connectionStatues.connectingFake){
                    tcpSocket.write(chunk,encoding,cb);
                }
                else if (status === connectionStatues.handshaking){
                    //do nothing
                }
                else if (status === connectionStatues.connected){
                    // do nothing
                }
            }
            tcpMuxTransformForReal._transform = (chunk,encoding,cb)=>{
                //real tls ====> tcp
                if(status === connectionStatues.connectingFake){
                    // do nothing
                }
                else if (status === connectionStatues.handshaking){
                    encryptDataAndAppendFakeHeader(
                        chunk, 
                        tlsApplicationDataHeader, 
                        algorithm, 
                        oneTimeEncryptKey, 
                        ivLength
                    ).then(encryptedData=>{
                        logger.info(`Sending Handshaking packet : ${encryptedData.length} bytes`)
                        tcpSocket.write(encryptedData,encoding,cb);
                    })
                }
                else if (status === connectionStatues.connected){
                    tcpSocket.write(chunk, encoding, cb);
                }
            }
            tcpSocket.on('data',(data)=>{
                //tcp =====> tls sockets
                if(status === connectionStatues.connectingFake){
                    tcpMuxTransformForFake.emit('data', data);
                }
                else if (status === connectionStatues.handshaking){
                    decryptDataAndRemoveFakeHeader(
                        data, 
                        tlsApplicationDataHeader, 
                        algorithm, 
                        oneTimeEncryptKey, 
                        ivLength
                    ).then(decryptedData=>{
                        if(typeof(decryptedData) != 'undefined'){
                            tcpMuxTransformForReal.emit('data', decryptedData);
                        }
                    })
                }
                else if (status === connectionStatues.connected){
                    tcpMuxTransformForReal.emit('data', data)
                }
            })

            doHandshakeToFake(fakeDomain,tcpMuxTransformForFake,fakeALPN).then(fakeTlsSocket=>{
                status = connectionStatues.handshaking;
                doRealHandshake(tcpMuxTransformForReal,ca).then(realTlsSocket=>{
                    status = connectionStatues.connected;
                    fakeTlsSocket.destroy();
                    resolve(realTlsSocket);
                })
            })

            //handle error 
            tcpSocket.on('error',(err)=>{
                logger.emergency(`tcp connection error : ${err}`)
                if(status === connectionStatues.connectingFake){
                    tcpMuxTransformForFake.emit('error', err);
                }
                else{
                    tcpMuxTransformForReal.emit('error',err);
                }
            })
            //handle close
            tcpSocket.on('close',(err)=>{
                logger.info(`tcp connection closed : ${err}`)
                if(status === connectionStatues.connectingFake){
                    tcpMuxTransformForFake.emit('close', err);
                }
                else{
                    tcpMuxTransformForReal.emit('close',err);
                }
            })
        })
    })
}

export {createLikeARealTlsClient}