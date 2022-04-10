import { Duplex, Stream, StreamOptions, Transform, TransformCallback } from "stream";
import lodash from 'lodash'

class TlsPacketParser extends Transform{
    private currentPacket:Buffer;
    private currentCopiedBytes : number = 0;
    private currentTlsHeader = Buffer.alloc(5);
    constructor(options? : StreamOptions<Duplex>){
        super({
            ...options,
            encoding:undefined,
            objectMode:true
        })
    }
    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
        if(!lodash.isBuffer(chunk))chunk = Buffer.from(chunk as unknown as string, encoding);
        let processedBytes = 0;
        while(processedBytes < chunk.byteLength){
            let toBeCopiedLength = 0;
            if(this.currentCopiedBytes<5){
                toBeCopiedLength = 5 - this.currentCopiedBytes;
            }
            else{
                const packetLength = this.currentPacket.byteLength;
                toBeCopiedLength = packetLength - this.currentCopiedBytes;
            }
            const remainBytes = chunk.byteLength - processedBytes;
            toBeCopiedLength = toBeCopiedLength< remainBytes?toBeCopiedLength:remainBytes;

            let copyTarget = (!lodash.isUndefined(this.currentPacket))?this.currentPacket:this.currentTlsHeader;
            chunk.copy(copyTarget, this.currentCopiedBytes, processedBytes, toBeCopiedLength);
            processedBytes += toBeCopiedLength;
            this.currentCopiedBytes += toBeCopiedLength;
            
            if(this.currentCopiedBytes == 5){
                const packetLength = (this.currentTlsHeader[3]<<8) | (this.currentTlsHeader[4]) + 5;
                this.currentPacket = Buffer.alloc(packetLength);
                this.currentTlsHeader.copy(this.currentPacket);
            }

            if(!lodash.isUndefined(this.currentPacket) && this.currentPacket.byteLength == this.currentCopiedBytes){
                this.push(this.currentPacket);
                this.currentPacket = undefined;
                this.currentCopiedBytes = 0;
            }
        }
        callback();
    }
}
export{TlsPacketParser};