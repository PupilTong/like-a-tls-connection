import { Duplex, PassThrough } from "stream";
import * as tcp from "net";
import { Separator } from "./Separator.js";
import { Mixer } from "./Mixer.js";
import { TlsPacketParser } from "./TlsPacketParser.js";
import lodash from "lodash";
class LatcServerSocket extends Duplex {
    constructor(hmacAlgorithm, salt, toClientSocket, toFakeServerSocket) {
        super({ objectMode: true });
        this.inBond = new PassThrough({ objectMode: true });
        this.outBond = new PassThrough({ objectMode: true });
        this.packetParser = new TlsPacketParser();
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
            if (!this.push(chunk)) {
                this.inBond.pause();
            }
        });
        this.toClientSocket.on('error', err => {
            err.name = `To Client Tcp Socket Error : ${err.name}`;
            this.destroy(err);
        });
        this.toClientSocket.on('close', () => {
            this.destroy();
        });
        this.toFakeServerSocket.on('error', err => {
            err.name = `To Fake Server Tcp Socket Error : ${err.name}`;
            this.destroy(err);
        });
        this.toFakeServerSocket.on('close', () => {
            this.destroy();
        });
    }
    _write(chunk, encoding, callback) {
        if (!lodash.isBuffer(chunk))
            chunk = Buffer.from(chunk, encoding);
        this.outBond.write(chunk, encoding, callback);
    }
    _destroy(error, callback) {
        try {
            this.toFakeServerSocket.destroy();
            this.toClientSocket.destroy();
            this.mixer.destroy();
            this.separator.destroy();
            this.packetParser.destroy();
            this.inBond.destroy();
            this.outBond.destroy();
            callback(null);
        }
        catch (e) {
            callback(e);
        }
    }
    _read(size) {
        this.inBond.resume();
    }
}
function createServerSocket(toClientSocket, remoteFakeServerPort, remoteFakeServerHost, hmacAlgorithm, salt) {
    return new Promise((resolve, reject) => {
        const tcpSocket = tcp.createConnection({
            host: remoteFakeServerHost,
            port: remoteFakeServerPort,
        }, () => {
            resolve(new LatcServerSocket(hmacAlgorithm, salt, toClientSocket, tcpSocket));
        });
    });
}
export { createServerSocket, LatcServerSocket };
//# sourceMappingURL=LatcServerSocket.js.map