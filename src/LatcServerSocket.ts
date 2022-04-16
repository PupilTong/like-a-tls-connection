import { Duplex, PassThrough, Readable, Writable, Transform } from "stream";
import * as tls from "tls";
import * as tcp from "net";
import { count } from "console";
import { Separator } from "./Separator.js";
import { Mixer } from "./Mixer.js";
import { TlsPacketParser } from "./TlsPacketParser.js";
import lodash from "lodash";
class LatcServerSocket extends Duplex {
    private readonly inBond = new PassThrough({ objectMode: true });
    private readonly outBond = new PassThrough({ objectMode: true });
    private readonly packetParser = new TlsPacketParser();

    private readonly separator: Separator;
    private readonly mixer: Mixer;

    private readonly toClientSocket: Duplex;
    private readonly toFakeServerSocket: Duplex;
    private readonly hmacAlgorithm: "sha256" | "sha512";
    private readonly salt: string | Buffer;
    constructor(
        hmacAlgorithm: "sha256" | "sha512",
        salt: string | Buffer,
        toClientSocket: Duplex,
        toFakeServerSocket: Duplex,
    ) {
        super({ objectMode: true });
        this.hmacAlgorithm = hmacAlgorithm;
        this.salt = salt;
        this.toClientSocket = toClientSocket;
        this.toFakeServerSocket = toFakeServerSocket;

        this.mixer = new Mixer(hmacAlgorithm, salt, this.outBond, this.toFakeServerSocket);
        this.mixer.pipe(toClientSocket);

        this.separator = new Separator(this.hmacAlgorithm, this.salt, this.inBond, this.toFakeServerSocket);
        this.toClientSocket.pipe(this.packetParser);
        this.packetParser.pipe(this.separator);

        this.inBond.on("data", (chunk) => {
            if(!this.push(chunk)){
                this.inBond.pause();
            }
        });

        this.toClientSocket.on('error', err=>{
            err.name = `To Client Tcp Socket Error : ${err.name}`
            this.emit('error', err);
        })
        this.toClientSocket.on('close',()=>{
            this.destroy();
        })
        this.toFakeServerSocket.on('error', err=>{
            err.name = `To Fake Server Tcp Socket Error : ${err.name}`
            this.emit('error',err);
        })
        this.toFakeServerSocket.on('close',()=>{
            this.destroy();
        })
    }
    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error) => void): void {
        if(!lodash.isBuffer(chunk))chunk = Buffer.from(chunk as unknown as string, encoding);
        this.outBond.write(chunk, encoding, callback);
    }
    _destroy(error: Error, callback: (error: Error) => void): void {
        try{
            this.toFakeServerSocket.destroy();
            this.toClientSocket.destroy();
        }
        catch(e){
            callback(e);
        }
    }
    _read(size: number): void {
        this.inBond.resume();
    }
}
function createServerSocket(
    toClientSocket : Duplex,
    remoteFakeServerPort: number,
    remoteFakeServerHost: string,
    hmacAlgorithm: "sha256" | "sha512",
    salt: string | Buffer
): Promise<LatcServerSocket> {
    return new Promise<LatcServerSocket>((resolve,reject)=>{
        const tcpSocket = tcp.createConnection(
            {
                host: remoteFakeServerHost,
                port: remoteFakeServerPort,
            },
            () => {
                resolve(new LatcServerSocket(hmacAlgorithm, salt, toClientSocket, tcpSocket));
            }
        );
    })
}
export { createServerSocket, LatcServerSocket };
