import * as tls from 'tls'
import * as tcp from 'net'
import { PassThrough, Transform } from "stream";
import { likeARealTlsOption } from '.';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// const fakeDomain  = 'www.microsoft.com';
const debug = true;
const activateLikeARealTlsServer = function(options:likeARealTlsOption, tcpServer: tcp.Server){
    const algthroim = options.algthroim;
    const oneTimeEncryptKey = options.oneTimeEncryptKey;
    const ivLength = options.ivLength;
    const tlsApplicationDataHeader = Buffer.from(options.tlsApplicationDataHeader);
    const fakeDomain = options.fakeDomain
    const ca = options.ca;
    const cert = options.cert;
    const key = options.key;
    enum connectionStatues {
        handshaking,
        connected
    }

    tcpServer.on('connection',(socket)=>{
        let status = connectionStatues.handshaking;

        //forward all packets to Fake
        const tcpSocketToFake = tcp.connect({
            host:fakeDomain,
            port:443
        },()=>{
            socket.on('data',(data)=>{
                if(status===connectionStatues.handshaking){
                    tcpSocketToFake.write(data,(error)=>{
                        if(error)socket.emit('error',error);
                    });
                }
            })
            tcpSocketToFake.on('data',(data)=>{
                if(status===connectionStatues.handshaking){
                    socket.write(data,(error)=>{
                        if(error)socket.emit('error',error);
                    });
                }
            })
            tcpSocketToFake.on('end',()=>{
                if(status===connectionStatues.handshaking){
                    socket.end();
                }
            })
        })

        const tcpTransFormerToReal = new Transform();
        // client ========> server
        socket.on('data',(data)=>{
            if(status === connectionStatues.handshaking){
                const maybeApplicationHeader = data.subarray(0,tlsApplicationDataHeader.length);
                if(maybeApplicationHeader.compare(tlsApplicationDataHeader)===0){
                    const maybeIv = data.subarray(tlsApplicationDataHeader.length + 1, ivLength + tlsApplicationDataHeader.length + 1);
                    if(maybeIv.length === ivLength){
                        const decryption = createDecipheriv(algthroim, oneTimeEncryptKey, maybeIv);
                        decryption.on('data', (decryptedData) => {
                            tcpTransFormerToReal.emit('data',decryptedData);
                        })
                        decryption.write(data.subarray(tlsApplicationDataHeader.length + ivLength + 1, data.length));
                    }
                }
            }
            else if(status === connectionStatues.connected){
                tcpTransFormerToReal.emit('data',data);
            }
        })
        
        //server =====> client
        tcpTransFormerToReal._transform = (chunk, encoding, cb)=>{
            if(status === connectionStatues.handshaking){
                //do replace
                const iv = randomBytes(options.ivLength);
                const encryption = createCipheriv(algthroim, oneTimeEncryptKey, iv);
                encryption.on('data', (data) => {
                    const encryptedData = Buffer.concat([tlsApplicationDataHeader, iv, data]);
                    socket.write(encryptedData);
                })
                encryption.write(chunk,encoding,cb);
            }
            else if(status === connectionStatues.connected){
                socket.write(chunk,encoding,cb);
            }
        };
        const realTlsSocket = new tls.TLSSocket(tcpTransFormerToReal as any,{
            ca:ca,
            cert:cert,
            key:key,
            ciphers:`ECDHE-ECDSA-AES256-GCM-SHA384`,
            enableTrace:debug,
            isServer:true
        })
        realTlsSocket.on('secureConnect',()=>{
            status == connectionStatues.connected;
        })
    })
}
export {activateLikeARealTlsServer}
