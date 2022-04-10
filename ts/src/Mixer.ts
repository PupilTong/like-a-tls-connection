
import { createHmac } from 'crypto';
import lodash from 'lodash';
import * as tcp from 'net'
import { Duplex, PassThrough, Readable, StreamOptions, Transform } from 'stream';
class Mixer extends PassThrough implements Readable {
    protected tlsApplicationPacketHeader: Buffer;
    protected readonly algorithm: string;
    protected salt: string | Buffer;
    private readonly labeledPacket: PassThrough;
    private readonly passThroughPacket: Readable;
    constructor(
        algorithm: "sha256" | "sha512",
        salt: string | Buffer,
        toBeLabeledPacket: Readable,
        passThroughPacket: Readable,
        tlsApplicationPacketHeader?: Buffer,
        options?: StreamOptions<Readable>,
    ) {
        super({
            ...options,
            encoding:undefined,
            objectMode: true,
        });
        this.algorithm = algorithm;
        this.salt = salt;
        tlsApplicationPacketHeader = !lodash.isUndefined(tlsApplicationPacketHeader)
            ? tlsApplicationPacketHeader
            : Buffer.from([0x17, 0x03, 0x03]);
        this.tlsApplicationPacketHeader = tlsApplicationPacketHeader;
        this.passThroughPacket = passThroughPacket;
        this.labeledPacket = new Transform({
            transform:function(chunk,encoding,cb){
                if(!lodash.isBuffer(chunk))chunk = Buffer.from(chunk as unknown as string, encoding);
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
            objectMode:true
        });
        toBeLabeledPacket.pipe(this.labeledPacket);
        this.labeledPacket.pipe(this);
        this.passThroughPacket.pipe(this);
    }
}
export {Mixer}