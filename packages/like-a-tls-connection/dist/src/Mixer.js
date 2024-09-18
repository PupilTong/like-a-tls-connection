import { createHmac } from 'crypto';
import lodash from 'lodash';
import { PassThrough, Transform } from 'stream';
class Mixer extends PassThrough {
    constructor(algorithm, salt, toBeLabeledPacket, passThroughPacket, tlsApplicationPacketHeader, options) {
        super({
            ...options,
            encoding: undefined,
            objectMode: true,
        });
        this.algorithm = algorithm;
        this.salt = salt;
        tlsApplicationPacketHeader = !lodash.isUndefined(tlsApplicationPacketHeader)
            ? tlsApplicationPacketHeader
            : Buffer.from([0x17, 0x03, 0x03]);
        this.tlsApplicationPacketHeader = tlsApplicationPacketHeader;
        this.passThroughPacket = passThroughPacket;
        this.toBeLabeledPacket = toBeLabeledPacket;
        this.packetLabeler = new Transform({
            transform: function (chunk, encoding, cb) {
                if (!lodash.isBuffer(chunk))
                    chunk = Buffer.from(chunk, encoding);
                const hmac = createHmac(algorithm, salt);
                const hashedPacket = hmac.update(chunk).digest();
                const applicationPacketLength = chunk.byteLength + hashedPacket.byteLength;
                const applicationPacketLengthValue = Buffer.from([
                    (applicationPacketLength >> 8) & 0xff,
                    applicationPacketLength & 0xff,
                ]);
                const finalPacket = Buffer.concat([
                    tlsApplicationPacketHeader,
                    applicationPacketLengthValue,
                    hashedPacket,
                    chunk,
                ]);
                this.push(finalPacket);
                cb();
            },
            objectMode: true
        });
        toBeLabeledPacket.pipe(this.packetLabeler);
        this.packetLabeler.pipe(this);
        this.passThroughPacket.pipe(this);
    }
    getToBeLabeledPacketStream() {
        return this.toBeLabeledPacket;
    }
    getPassthroughPacketStream() {
        return this.passThroughPacket;
    }
}
export { Mixer };
//# sourceMappingURL=Mixer.js.map