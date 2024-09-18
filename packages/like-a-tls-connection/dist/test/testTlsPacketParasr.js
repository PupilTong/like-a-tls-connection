import { TlsPacketParser } from "../src/TlsPacketParser.js";
import should from 'should';
import * as tcp from 'net';
import * as tls from 'tls';
import { Duplex, PassThrough } from "stream";
describe("Test Tls PacketParser", () => {
    let parser;
    beforeEach(() => {
        parser = new TlsPacketParser();
    });
    it("test one packet", (done) => {
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03];
        parser.on('data', (data) => {
            should.equal(Buffer.compare(data, Buffer.from(data)), 0);
            done();
        });
        parser.write(Buffer.from(data));
    });
    it("test two packets", (done) => {
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03];
        let count = 0;
        parser.on('data', (data) => {
            should.equal(Buffer.compare(data, Buffer.from(data)), 0);
            count++;
            if (count == 2) {
                done();
            }
        });
        parser.write(Buffer.from(data));
        parser.write(Buffer.from(data));
    });
    it("test one fragmented packets", (done) => {
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03];
        parser.on('data', (data) => {
            should.equal(Buffer.compare(data, Buffer.from(data)), 0);
            done();
        });
        data.forEach((value) => {
            parser.write(Buffer.from([value]));
        });
    });
    it("test two fragmented packets", (done) => {
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03];
        let count = 0;
        parser.on('data', (data) => {
            should.equal(Buffer.compare(data, Buffer.from(data)), 0);
            count++;
            if (count == 2) {
                done();
            }
        });
        for (let i = 0; i < 2; i++) {
            data.forEach((value) => {
                parser.write(Buffer.from([value]));
            });
        }
    });
    it("test three fragmented packets", (done) => {
        const rawData = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03];
        let count = 0;
        parser.on('data', (data) => {
            should.equal(Buffer.compare(data, Buffer.from(data)), 0);
            count += data.byteLength;
            if (count == rawData.length * 3) {
                done();
            }
        });
        for (let i = 0; i < 3; i++) {
            rawData.forEach((value) => {
                parser.write(Buffer.from([value]));
            });
        }
    });
    it("test Interoperability with tls", function (done) {
        this.timeout(5000);
        const hostName = "nodejs.org";
        const tcpSocket = tcp.connect({
            host: hostName,
            port: 443
        }, () => {
            const writeToSocket = new PassThrough();
            const readFromSocket = new PassThrough();
            tcpSocket.pipe(parser);
            parser.pipe(readFromSocket);
            writeToSocket.pipe(tcpSocket);
            const tcpBridge = Duplex.from({
                writable: writeToSocket,
                readable: readFromSocket
            });
            const tlsSocket = tls.connect({
                socket: tcpBridge,
                checkServerIdentity: (host, cert) => {
                    const isValid = tls.checkServerIdentity(hostName, cert);
                    should.equal(isValid, null);
                    done();
                    tlsSocket.destroy();
                    return isValid;
                },
                timeout: 3000
            });
            tlsSocket.on('error', (err) => {
            });
        });
    });
    afterEach(() => {
        parser.destroy();
    });
});
//# sourceMappingURL=testTlsPacketParasr.js.map