/// <reference types="node" />
/// <reference types="node" />
import { PassThrough, Readable, StreamOptions } from 'stream';
declare class Mixer extends PassThrough implements Readable {
    protected tlsApplicationPacketHeader: Buffer;
    protected readonly algorithm: string;
    protected salt: string | Buffer;
    private readonly toBeLabeledPacket;
    private readonly passThroughPacket;
    private readonly packetLabeler;
    constructor(algorithm: "sha256" | "sha512", salt: string | Buffer, toBeLabeledPacket: Readable, passThroughPacket: Readable, tlsApplicationPacketHeader?: Buffer, options?: StreamOptions<Readable>);
    getToBeLabeledPacketStream(): Readable;
    getPassthroughPacketStream(): Readable;
}
export { Mixer };
