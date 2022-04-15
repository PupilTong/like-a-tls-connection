import { Transform, Duplex, TransformCallback, PassThrough, Writable, Readable } from "stream";
import * as tls from "tls";
import * as tcp from "net";
import * as udp from "dgram";
import { Separator } from "./Separator.js";
import { Mixer } from "./Mixer.js";
import { TlsPacketParser } from "./TlsPacketParser.js";
import lodash from "lodash";

interface _LatcClientSocketOptions extends Duplex {
    readonly port: number,
    readonly host: string,
    readonly hmacAlgorithm : "sha256" | "sha512",
    readonly salt: string,
    getHmacAlgorithm:()=>"sha256" | "sha512",
    getSalt:()=>string | Buffer,
    getFakeTlsSocket:()=>tls.TLSSocket
}
interface LatcClientSocket extends Duplex {
    readonly port: number,
    readonly host: string,
    readonly hmacAlgorithm : "sha256" | "sha512",
    readonly salt: string,
    getHmacAlgorithm:()=>"sha256" | "sha512",
    getSalt:()=>string | Buffer,
    getFakeTlsSocket:()=>tls.TLSSocket
}
function createClientSocket(
    port: number,
    host: string,
    hmacAlgorithm: "sha256" | "sha512",
    salt: string | Buffer,
    fakeTlsSocketOption?: tls.ConnectionOptions
): Promise<LatcClientSocket> {
    return new Promise((resolve, reject) => {
        const tcpSocket = tcp.createConnection(port, host, function(){
            const packetParser = new TlsPacketParser();
            const toBeLabeledStream = new PassThrough({ objectMode: true });
            const receivedLabeledStream = new PassThrough({ objectMode: true });
            const toBePassThroughStream = new PassThrough();
            const receivedPassThroughStream = new PassThrough();
            const mixer = new Mixer(hmacAlgorithm, salt, toBeLabeledStream, toBePassThroughStream);
            mixer.pipe(tcpSocket);
            const separator = new Separator(hmacAlgorithm, salt, receivedLabeledStream, receivedPassThroughStream);
            packetParser.pipe(separator);
            tcpSocket.pipe(packetParser);

            const toFakeTlsStream = Duplex.from({
                writable:toBePassThroughStream,
                readable:receivedPassThroughStream,
            });
            const fakeTlsSocket = tls.connect({
                            ...fakeTlsSocketOption,
                            socket: toFakeTlsStream,
            },()=>{
                const latcClientSocket = Duplex.from({
                    writable: toBeLabeledStream,
                    readable: receivedLabeledStream
                }) as LatcClientSocket;

                latcClientSocket.getHmacAlgorithm = function(){
                    return hmacAlgorithm;
                }
                latcClientSocket.getSalt = function(){
                    return salt;
                }
                latcClientSocket.getFakeTlsSocket = function() {
                    return fakeTlsSocket;
                }
                latcClientSocket._destroy = function(err,cb){
                    try{
                        tcpSocket.destroy();
                        latcClientSocket.destroy();
                        toFakeTlsStream.destroy();
                        mixer.destroy();
                        separator.destroy();
                        toBeLabeledStream.destroy();
                        toBePassThroughStream.destroy();
                        receivedLabeledStream.destroy();
                        receivedPassThroughStream.destroy();
                        packetParser.destroy();
                    } catch (e){
                        cb(e);
                    }
                }
                tcpSocket.on('error',(err)=>{
                    latcClientSocket.destroy(err);
                })
                fakeTlsSocket.on('error',(err)=>{
                    latcClientSocket.destroy(err);
                })
                resolve(latcClientSocket);
            });
        });
    });
}
export { createClientSocket, LatcClientSocket };
