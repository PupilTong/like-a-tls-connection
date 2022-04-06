import internal, { Duplex, Stream, StreamOptions, Transform, TransformCallback } from "stream";

class TlsPacketParser extends Transform{
    private currentPacket:Buffer;
    private currentCopiedBytes : number;
    constructor(options? : StreamOptions<Duplex>){
        super({
            ...options,
            encoding:undefined,
            objectMode:true
        })
    }
    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
        let toBeProcessedBytes = chunk.byteLength;
        while(toBeProcessedBytes > 0){
            let toBeCopiedLength = 0;
            if(!this.currentPacket){
                let packetLength = (chunk.at(3)<<8) | (chunk.at(4));
                this.currentPacket = Buffer.alloc(packetLength);
                toBeCopiedLength = (chunk.byteLength < this.currentPacket.byteLength) ? chunk.byteLength:this.currentPacket.byteLength;
            }
            else{
                const notCopiedBytes = this.currentPacket.length - this.currentCopiedBytes;
                toBeCopiedLength = (chunk.byteLength<notCopiedBytes)?chunk.byteLength: notCopiedBytes;
            }
            chunk.copy(this.currentPacket, 0, 0, toBeCopiedLength);
            this.currentCopiedBytes += toBeCopiedLength;
            if(this.currentPacket.length === this.currentCopiedBytes){
                this.push(this.currentPacket);
                this.currentPacket = undefined;
                this.currentCopiedBytes = 0;
            }
            toBeProcessedBytes -= toBeCopiedLength;
        }
        callback();
    }
}
export{TlsPacketParser};