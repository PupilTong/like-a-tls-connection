/// <reference types="node" />
/// <reference types="node" />
import { StreamOptions, Writable } from "stream";
declare class Separator extends Writable {
    private readonly labeledPacketStream;
    private readonly unlabeledPacketStream;
    protected tlsApplicationPacketHeader: Buffer;
    protected readonly algorithm: string;
    protected salt: string | Buffer;
    protected verifyAndGetRawPacket(rawPacket: Buffer, labeledPacketCb: (data: Buffer) => void, unlabeledPacketCb: (data: Buffer) => void): void;
    constructor(algorithm: "sha256" | "sha512", salt: string | Buffer, labeledPacketStream: Writable, unlabeledPacketStream: Writable, tlsApplicationPacketHeader?: Buffer, options?: StreamOptions<Writable>);
    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error) => void): void;
    getLabeledPacketStream(): Writable;
    getUnlabeledPacketStream(): Writable;
}
export { Separator };
