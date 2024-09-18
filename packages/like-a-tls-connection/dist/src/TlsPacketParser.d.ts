/// <reference types="node" />
/// <reference types="node" />
import { Duplex, StreamOptions, Transform, TransformCallback } from "stream";
declare class TlsPacketParser extends Transform {
    private currentPacket;
    private currentCopiedBytes;
    private currentTlsHeader;
    constructor(options?: StreamOptions<Duplex>);
    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void;
}
export { TlsPacketParser };
