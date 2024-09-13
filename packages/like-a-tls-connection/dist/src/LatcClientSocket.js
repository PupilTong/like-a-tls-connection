import { Duplex, PassThrough, } from "stream";
import * as tls from "tls";
import * as tcp from "net";
import { Separator } from "./Separator.js";
import { Mixer } from "./Mixer.js";
import { TlsPacketParser } from "./TlsPacketParser.js";
function createClientSocket(port, host, hmacAlgorithm, salt, fakeTlsSocketOption) {
    return new Promise((resolve, reject) => {
        try {
            const tcpSocket = tcp.createConnection(port, host, function () {
                const packetParser = new TlsPacketParser();
                const toBeLabeledStream = new PassThrough({ objectMode: true });
                const receivedLabeledStream = new PassThrough({
                    objectMode: true,
                });
                const toBePassThroughStream = new PassThrough();
                const receivedPassThroughStream = new PassThrough();
                const mixer = new Mixer(hmacAlgorithm, salt, toBeLabeledStream, toBePassThroughStream);
                mixer.pipe(tcpSocket);
                const separator = new Separator(hmacAlgorithm, salt, receivedLabeledStream, receivedPassThroughStream);
                packetParser.pipe(separator);
                tcpSocket.pipe(packetParser);
                const toFakeTlsStream = Duplex.from({
                    writable: toBePassThroughStream,
                    readable: receivedPassThroughStream,
                });
                const fakeTlsSocket = tls.connect({
                    ...fakeTlsSocketOption,
                    socket: toFakeTlsStream,
                }, () => {
                    const latcClientSocket = Duplex.from({
                        writable: toBeLabeledStream,
                        readable: receivedLabeledStream,
                    });
                    latcClientSocket.getHmacAlgorithm = function () {
                        return hmacAlgorithm;
                    };
                    latcClientSocket.getSalt = function () {
                        return salt;
                    };
                    latcClientSocket.getFakeTlsSocket = function () {
                        return fakeTlsSocket;
                    };
                    latcClientSocket._destroy = function (err, cb) {
                        try {
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
                            cb(null);
                        }
                        catch (e) {
                            cb(e);
                        }
                    };
                    tcpSocket.removeAllListeners("error");
                    tcpSocket.on("error", (err) => {
                        latcClientSocket.destroy(err);
                    });
                    tcpSocket.removeAllListeners("end");
                    tcpSocket.on('end', () => {
                        latcClientSocket.destroy();
                    });
                    tcpSocket.removeAllListeners("close");
                    tcpSocket.on('close', (hadErr) => {
                        latcClientSocket.destroy();
                    });
                    fakeTlsSocket.on("error", (err) => {
                        latcClientSocket.destroy(err);
                    });
                    resolve(latcClientSocket);
                });
            });
            tcpSocket.once("error", (e) => {
                reject(e);
            });
            tcpSocket.once('close', () => {
                reject(new Error(`tcp socket closed very early`));
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
export { createClientSocket };
//# sourceMappingURL=LatcClientSocket.js.map