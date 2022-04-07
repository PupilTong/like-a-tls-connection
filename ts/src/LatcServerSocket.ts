import { Duplex, PassThrough, Readable, Writable, Transform } from "stream";
import * as tls from "tls";
import * as tcp from "net";
import { count } from "console";
import { Separator } from "./Separator.js";
import { Mixer } from "./Mixer.js";
import { TlsPacketParser } from "./TlsPacketParser.js";
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
        toFakeServerSocket: Duplex
    ) {
        super({ objectMode: true });
        this.hmacAlgorithm = hmacAlgorithm;
        this.salt = salt;
        this.toClientSocket = toClientSocket;
        this.toFakeServerSocket = toFakeServerSocket;

        this.mixer = new Mixer(hmacAlgorithm, salt, this.outBond, this.toFakeServerSocket);
        this.mixer.pipe(toClientSocket);

        this.toClientSocket.pipe(this.packetParser);
        this.separator = new Separator(this.hmacAlgorithm, this.salt, this.inBond, this.toFakeServerSocket);
        this.packetParser.pipe(this.separator);

        this.inBond.on("data", (chunk) => {
            this.push(chunk);
        });
    }
    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error) => void): void {
        this.outBond.write(chunk, encoding, callback);
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
