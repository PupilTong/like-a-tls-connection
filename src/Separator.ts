import { createHmac } from "crypto";
import internal, { Readable, StreamOptions, Writable } from "stream";
import * as udp from 'dgram'


class Separator extends Writable {
    private readonly labeledData: Writable;
    private readonly unlabeledData: Writable;
    protected tlsApplicationDataHeader: Buffer;
    protected readonly algorithm: string;
    protected salt: string | Buffer;
    protected verifyAndGetRawData(
        rawData: Buffer,
        labeledDataCb: (data: Buffer) => void,
        unlabeledDataCb: (data: Buffer) => void,
    ): void {
        const maybeApplicationHeader = rawData.subarray(
            0,
            this.tlsApplicationDataHeader.byteLength,
        );
        if (
            maybeApplicationHeader.compare(this.tlsApplicationDataHeader) === 0
        ) {
            let hmac = createHmac(this.algorithm, this.salt);
            const hashedDataLength = hmac
                .update("getLength")
                .digest().byteLength;
            const maybeHashedData = rawData.subarray(
                this.tlsApplicationDataHeader.byteLength + 2,
                this.tlsApplicationDataHeader.byteLength + 2 + hashedDataLength,
            );
            const receivedData = rawData.subarray(
                this.tlsApplicationDataHeader.byteLength + 2 + hashedDataLength,
                rawData.byteLength,
            );
            hmac = createHmac(this.algorithm, this.salt);
            const hashedReceivedData = hmac.update(receivedData).digest();
            if (Buffer.compare(maybeHashedData, hashedReceivedData) === 0) {
                labeledDataCb(receivedData);
                return;
            }
        }
        unlabeledDataCb(rawData);
    }
    constructor(
        algorithm: "sha256" | "sha512",
        salt: string | Buffer,
        labeledData: Writable,
        unlabeledData: Writable,
        tlsApplicationDataHeader?: Buffer,
        options?: StreamOptions<Writable>,
    ) {
        super({
            ...options,
            objectMode: true,
        });
        this.algorithm = algorithm;
        this.salt = salt;
        this.tlsApplicationDataHeader = tlsApplicationDataHeader?tlsApplicationDataHeader:Buffer.from([0x17, 0x03, 0x03]);
        this.labeledData = labeledData;
        this.unlabeledData = unlabeledData;
    }
    _write(
        chunk: Buffer,
        encoding: BufferEncoding,
        callback: (error?: Error) => void,
    ): void {
        this.verifyAndGetRawData(
            chunk,
            (data) => {
                if (!this.labeledData.write(data, callback)) {
                    this.labeledData.once("drain", callback);
                    return false;
                } else {
                    return true;
                }
            },
            (data) => {
                if (!this.unlabeledData.write(data, callback)) {
                    this.unlabeledData.once("drain", callback);
                    return false;
                } else {
                    return true;
                }
            },
        );
    }
    _destroy(error: Error, callback: (error?: Error) => void): void {
        try {
            this.labeledData.destroy(error);
            this.unlabeledData.destroy(error);
        } catch (e) {
            callback(e);
        }
    }
}
export {Separator}