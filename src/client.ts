import * as tls from 'tls'
import * as tcp from 'net'
import { Transform } from 'stream';
import log from 'standard-log'
import { likeARealTlsOption } from '.';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
const logger = log.getLogger('client');
const debug = true;
// const remoteAddr = "127.0.0.1"
const remoteAddr = "www.apple.com"
const remoteTcpSocket = tcp.connect({
    host: remoteAddr,
    port: 443,
}, () => {
})
// const ca = readFileSync('dist/cert/ca.crt');
// const randomKey = "something";

// const fakeClientInfo = {
//     fakeDomain: "www.apple.com",
//     ALPN: ['h2', 'http/1.1']
// }



//'chacha20-poly1305'
const createLikeARealTlsClient = function (host:string,port:number,options:likeARealTlsOption) : tls.TLSSocket {
    const algthroim = options.algthroim;
    const oneTimeEncryptKey = options.oneTimeEncryptKey;
    const ivLength = options.ivLength;
    const tcpSocket = options.tcpSocket;
    const tlsApplicationDataHeader = options.tlsApplicationDataHeader;
    const fakeALPN = options.fakeALPN;
    const fakeDomain = options.fakeDomain
    const ca = options.ca;
    enum connectionStatues {
        connectingFake,
        handshaking,
        connected
    }


    let status: connectionStatues = connectionStatues.connectingFake;
    // create a pipe for the fake socket
    const fakeTcpPipe = new Transform();
    fakeTcpPipe._transform = (chunk, encoding, cb) => {
        if(status == connectionStatues.connectingFake){
            tcpSocket.write(chunk, encoding, cb);
        }
    }
    const fakeTcpPipeEmitter = (data:Buffer) => {
        if(status == connectionStatues.connectingFake){
            fakeTcpPipe.emit('data', data);
        }
    }
    tcpSocket.on('data', fakeTcpPipeEmitter);
    //-----------------------------------------------------
    
    // do fake handshake
    const fakeTlsSocket = tls.connect({
        enableTrace: debug,
        socket: fakeTcpPipe,
        rejectUnauthorized: true,
        ALPNProtocols: fakeALPN,
        servername: fakeDomain,
    }, () => {
        logger.info(`successfully connected to ${fakeDomain}`);

        // verified remote certification, do next step
        status = connectionStatues.handshaking;
        // create a pipe for real tunnel tls socket
        const tlsHandshakeTransformer = new Transform();
        tlsHandshakeTransformer._transform = (chunk, encoding, cb) => {
            //do replace
            if (status === connectionStatues.handshaking) {
                const iv = randomBytes(options.ivLength);
                const encryption = createCipheriv(algthroim, oneTimeEncryptKey, iv);
                encryption.on('data', (data) => {
                    const encryptedData = Buffer.concat([tlsApplicationDataHeader, iv, data]);
                    tcpSocket.write(encryptedData, encoding, cb);
                })
                encryption.write(chunk,encoding,cb);
            }
            else if(status === connectionStatues.connected) {
                tcpSocket.write(chunk, encoding, cb);
            }
        }
        tcpSocket.on('data', (data) => {
            //replace back 
            if (status === connectionStatues.handshaking) {
                const iv = data.subarray(tlsApplicationDataHeader.length + 1, tlsApplicationDataHeader.length + ivLength);
                const decryption = createDecipheriv(algthroim, oneTimeEncryptKey, iv);
                decryption.on('data', (decryptedData) => {
                    tlsHandshakeTransformer.emit('data',decryptedData);
                })
                decryption.write(data.subarray(tlsApplicationDataHeader.length + ivLength + 1, data.length));
            }
            else if(status === connectionStatues.connected) {
                tlsHandshakeTransformer.emit('data', data);
            }
        })
        //--------------------------------------------------------------

        //do the real handshake, information is protected by the encryption

        // remove pipe to fake socket
        fakeTcpPipe._transform=()=>{
            //do nothing;
        }
        tcpSocket.removeListener('data',fakeTcpPipeEmitter);
        fakeTlsSocket.destroy();
        fakeTcpPipe.destroy();
        
        const realTlsSocket:tls.TLSSocket = tls.connect({
            ca: ca,
            enableTrace: debug,
            socket: tlsHandshakeTransformer,
            rejectUnauthorized: true,
            ciphers: `ECDHE-ECDSA-AES256-GCM-SHA384`,
        }, () => {
            logger.info(`successfully connected to real remote`);

            //successfully do the handshake do next step
            status = connectionStatues.connected;

            return realTlsSocket;


        });
    });
    throw `failed to create the tls socket`
}

export {createLikeARealTlsClient}