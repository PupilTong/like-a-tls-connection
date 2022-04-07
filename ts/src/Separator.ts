import { createHmac } from "crypto";
import internal, { Readable, StreamOptions, Writable } from "stream";
import * as udp from 'dgram'


class Separator extends Writable {
    private readonly labeledPacketStream: Writable;
    private readonly unlabeledPacketStream: Writable;
    protected tlsApplicationPacketHeader: Buffer;
    protected readonly algorithm: string;
    protected salt: string | Buffer;
    protected verifyAndGetRawPacket(
        rawPacket: Buffer,
        labeledPacketCb: (data: Buffer) => void,
        unlabeledPacketCb: (data: Buffer) => void,
    ): void {
        const maybeApplicationHeader = rawPacket.subarray(
            0,
            this.tlsApplicationPacketHeader.byteLength,
        );
        if (
            maybeApplicationHeader.compare(this.tlsApplicationPacketHeader) === 0
        ) {
            let hmac = createHmac(this.algorithm, this.salt);
            const hashedPacketLength = hmac
                .update("getLength")
                .digest().byteLength;
            const maybeHashedPacket = rawPacket.subarray(
                this.tlsApplicationPacketHeader.byteLength + 2,
                this.tlsApplicationPacketHeader.byteLength + 2 + hashedPacketLength,
            );
            const receivedPacket = rawPacket.subarray(
                this.tlsApplicationPacketHeader.byteLength + 2 + hashedPacketLength,
                rawPacket.byteLength,
            );
            hmac = createHmac(this.algorithm, this.salt);
            const hashedReceivedPacket = hmac.update(receivedPacket).digest();
            if (Buffer.compare(maybeHashedPacket, hashedReceivedPacket) === 0) {
                labeledPacketCb(receivedPacket);
                return;
            }
        }
        unlabeledPacketCb(rawPacket);
    }
    constructor(
        algorithm: "sha256" | "sha512",
        salt: string | Buffer,
        labeledPacketStream: Writable,
        unlabeledPacketStream: Writable,
        tlsApplicationPacketHeader?: Buffer,
        options?: StreamOptions<Writable>,
    ) {
        super({
            ...options,
            defaultEncoding:undefined,
            objectMode: true,
        });
        this.algorithm = algorithm;
        this.salt = salt;
        this.tlsApplicationPacketHeader = tlsApplicationPacketHeader?tlsApplicationPacketHeader:Buffer.from([0x17, 0x03, 0x03]);
        this.labeledPacketStream = labeledPacketStream;
        this.unlabeledPacketStream = unlabeledPacketStream;
    }
    _write(
        chunk: Buffer,
        encoding: BufferEncoding,
        callback: (error?: Error) => void,
    ): void {
        this.verifyAndGetRawPacket(
            chunk,
            (data) => {
                if (!this.labeledPacketStream.write(data, callback)) {
                    this.labeledPacketStream.once("drain", callback);
                    return false;
                } else {
                    return true;
                }
            },
            (data) => {
                if (!this.unlabeledPacketStream.write(data, callback)) {
                    this.unlabeledPacketStream.once("drain", callback);
                    return false;
                } else {
                    return true;
                }
            },
        );
    }
    _destroy(error: Error, callback: (error?: Error) => void): void {
        try {
            this.labeledPacketStream.destroy(error);
            this.unlabeledPacketStream.destroy(error);
        } catch (e) {
            callback(e);
        }
    }
    getLabeledPacketStream(){
        return this.labeledPacketStream;
    }
    getUnlabeledPacketStream(){
        return this.unlabeledPacketStream;
    }
}
export {Separator}