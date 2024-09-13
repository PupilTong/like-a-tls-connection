import { createHmac } from "crypto";
import { Writable } from "stream";
import lodash from "lodash";
class Separator extends Writable {
    verifyAndGetRawPacket(rawPacket, labeledPacketCb, unlabeledPacketCb) {
        const maybeApplicationHeader = rawPacket.subarray(0, this.tlsApplicationPacketHeader.byteLength);
        if (maybeApplicationHeader.compare(this.tlsApplicationPacketHeader) === 0) {
            let hmac = createHmac(this.algorithm, this.salt);
            const hashedPacketLength = hmac
                .update("getLength")
                .digest().byteLength;
            const maybeHashedPacket = rawPacket.subarray(this.tlsApplicationPacketHeader.byteLength + 2, this.tlsApplicationPacketHeader.byteLength + 2 + hashedPacketLength);
            const receivedPacket = rawPacket.subarray(this.tlsApplicationPacketHeader.byteLength + 2 + hashedPacketLength, rawPacket.byteLength);
            hmac = createHmac(this.algorithm, this.salt);
            const hashedReceivedPacket = hmac.update(receivedPacket).digest();
            if (Buffer.compare(maybeHashedPacket, hashedReceivedPacket) === 0) {
                labeledPacketCb(receivedPacket);
                return;
            }
        }
        unlabeledPacketCb(rawPacket);
    }
    constructor(algorithm, salt, labeledPacketStream, unlabeledPacketStream, tlsApplicationPacketHeader, options) {
        super({
            ...options,
            defaultEncoding: undefined,
            objectMode: true,
        });
        this.algorithm = algorithm;
        this.salt = salt;
        this.tlsApplicationPacketHeader = tlsApplicationPacketHeader ? tlsApplicationPacketHeader : Buffer.from([0x17, 0x03, 0x03]);
        this.labeledPacketStream = labeledPacketStream;
        this.unlabeledPacketStream = unlabeledPacketStream;
    }
    _write(chunk, encoding, callback) {
        if (!lodash.isBuffer(chunk))
            chunk = Buffer.from(chunk, encoding);
        this.verifyAndGetRawPacket(chunk, (data) => {
            if (!this.labeledPacketStream.write(data, callback)) {
                this.labeledPacketStream.once("drain", callback);
                return false;
            }
            else {
                return true;
            }
        }, (data) => {
            if (!this.unlabeledPacketStream.write(data, callback)) {
                this.unlabeledPacketStream.once("drain", callback);
                return false;
            }
            else {
                return true;
            }
        });
    }
    getLabeledPacketStream() {
        return this.labeledPacketStream;
    }
    getUnlabeledPacketStream() {
        return this.unlabeledPacketStream;
    }
}
export { Separator };
//# sourceMappingURL=Separator.js.map