import { Transform, Duplex, TransformCallback, PassThrough } from "stream";
import * as tls from "tls";
import * as tcp from "net";
import * as udp from "dgram";
import { Separator } from "./Separator.js";
import { Mixer } from "./Mixer.js";
import { TlsPacketParser } from "./TlsPacketParser.js";
import { StreamBridge } from "./StreamBridge.js";
import lodash from "lodash";

class LatcClientSocket extends Duplex {
    private readonly hmacAlgorithm: "sha256" | "sha512";
    private readonly salt: string | Buffer;
    private readonly externalConnectionSocket: Duplex;

    private readonly toBeLabeledStream = new PassThrough({ objectMode: true });
    private readonly receivedLabeledStream = new PassThrough({ objectMode: true });
    private readonly packetParser = new TlsPacketParser();
    private readonly toFakeTlsBridge = new StreamBridge();

    private readonly separator: Separator;
    private readonly mixer: Mixer;
    private readonly fakeTlsSocket: tls.TLSSocket;
    public getFakeTlsSocket() {
        return this.fakeTlsSocket;
    }
    constructor(
        hmacAlgorithm: "sha256" | "sha512",
        salt: string | Buffer,
        externalConnectionSocket: Duplex,
        fakeTlsSocketOption: tls.ConnectionOptions
    ) {
        super({
            objectMode: true,
        });
        this.hmacAlgorithm = hmacAlgorithm;
        this.salt = salt;
        this.externalConnectionSocket = externalConnectionSocket;

        this.mixer = new Mixer(hmacAlgorithm, salt, this.toBeLabeledStream, this.toFakeTlsBridge.socket0);
        this.mixer.pipe(this.externalConnectionSocket);
        this.separator = new Separator(hmacAlgorithm, salt, this.receivedLabeledStream, this.toFakeTlsBridge.socket0);
        this.packetParser.pipe(this.separator);
        this.externalConnectionSocket.pipe(this.packetParser);

        this.fakeTlsSocket = tls.connect({
            ...fakeTlsSocketOption,
            socket: this.toFakeTlsBridge.socket1,
        });
        this.receivedLabeledStream.on("data", (chunk) => {
            this.push(chunk);
        });
        this.externalConnectionSocket.on('error', err=>{
            err.name = `Client Tcp Socket Error : ${err.name}`
            this.emit('error', err);
        })
        this.externalConnectionSocket.on('close', ()=>{
            this.destroy();
        })
    }
    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error) => void): void {
        if(!lodash.isBuffer(chunk))chunk = Buffer.from(chunk as unknown as string, encoding);
        this.toBeLabeledStream.write(chunk, encoding, callback);
    }
    _destroy(error: Error, callback: (error: Error) => void): void {
        try {
            this.separator.destroy(error);
            this.mixer.destroy(error);
            this.packetParser.destroy(error);
            this.toBeLabeledStream.destroy(error);
            this.receivedLabeledStream.destroy(error);
            this.toFakeTlsBridge.destroy();
            this.externalConnectionSocket.destroy(error);
            this.fakeTlsSocket.destroy(error);
        } catch (e) {
            callback(e);
        }
    }
    getHmacAlgorithm() {
        return this.hmacAlgorithm;
    }
    getSalt() {
        return this.salt;
    }
}
function createClientSocket(
    port: number,
    host: string,
    hmacAlgorithm: "sha256" | "sha512",
    salt: string | Buffer,
    fakeTlsSocketOption?: tls.ConnectionOptions
): Promise<LatcClientSocket> {
    return new Promise((resolve, reject) => {
        const tcpSocket = tcp.createConnection(port, host, () => {
            resolve(new LatcClientSocket(hmacAlgorithm, salt, tcpSocket, fakeTlsSocketOption));
        });
    });
}
export { createClientSocket, LatcClientSocket };
