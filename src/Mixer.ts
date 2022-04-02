
import { createHmac } from 'crypto';
import * as tcp from 'net'
import { Duplex, PassThrough, Readable, StreamOptions, Transform, Writable } from 'stream';
// interface likeARealTlsOption extends tcp.TcpNetConnectOpts {
//     oneTimehashKey: string,
//     algorithm: string,
//     tlsApplicationDataHeader:Buffer,
//     fakeDomain:string,
//     fakeALPN?: string[],
// }


class Mixer extends Readable {
    protected tlsApplicationDataHeader: Buffer;
    protected readonly algorithm: string;
    protected salt: string | Buffer;
    private readonly labeledData: PassThrough;
    private readonly passThroughData: Readable;
    constructor(
        algorithm: "sha256" | "sha512",
        salt: string | Buffer,
        toBeLabeledData: Readable,
        passThroughData: Readable,
        tlsApplicationDataHeader?: Buffer,
        options?: StreamOptions<Readable>,
    ) {
        super({
            ...options,
            objectMode: true,
        });
        this.algorithm = algorithm;
        this.salt = salt;
        this.tlsApplicationDataHeader = tlsApplicationDataHeader
            ? tlsApplicationDataHeader
            : Buffer.from([0x17, 0x03, 0x03]);
        this.passThroughData = passThroughData;
        this.labeledData = new Transform({
            transform:function(chunk,encoding,cb){
                const hmac = createHmac(algorithm, salt);
                const hashedData = hmac.update(chunk).digest();
                const applicationDataLength = chunk.byteLength + hashedData.byteLength;
                const applicationDataLengthValue = Buffer.from([
                    (applicationDataLength >> 8) & 0xff,
                    applicationDataLength & 0xff,
                ]);
                const finalData = Buffer.concat([
                    tlsApplicationDataHeader,
                    applicationDataLengthValue,
                    hashedData,
                    chunk,
                ]);
                cb(null,finalData);
            },
            objectMode:true
        });
        toBeLabeledData.pipe(this.labeledData);
    }
    _read(size: number): void {
        for(let i=0;i<size;i++){
            let data = this.passThroughData.read(size);
            if(!data){
                data = this.to.read(size);
            }
        }
    }
}

// const decryptDataAndRemoveFakeHeader = (
//     rawData: Buffer,
//     tlsApplicationDataHeader: Buffer,
//     algorithm: string,
//     cipherKey: string | Buffer,
// ): Promise<Buffer | undefined> => {
//     return new Promise<Buffer | undefined>((resolve, reject) => {
        
//         const maybeApplicationHeader = rawData.subarray(0, tlsApplicationDataHeader.length);
//         if (maybeApplicationHeader.compare(tlsApplicationDataHeader) === 0) {
//             let hmac = createHmac(algorithm, cipherKey);
//             const hashedDataLength = hmac.update('getLength').digest().byteLength;
//             hmac = createHmac(algorithm, cipherKey);
//             const maybeHashedData = rawData.subarray(
//                 tlsApplicationDataHeader.length + 2,
//                 tlsApplicationDataHeader.length + 2 + hashedDataLength
//             );
//             const maybeOriginalData = rawData.subarray(
//                 tlsApplicationDataHeader.length + 2 + hashedDataLength,
//                 rawData.byteLength
//             );
//             const hashedOriginalData = hmac.update(maybeOriginalData).digest();
//             if(Buffer.compare(maybeHashedData, hashedOriginalData)===0){
//                 resolve(maybeOriginalData);
//             }
//             else{
//                 reject(new Error(`Authentication failed! hash doesn't match`))
//             }
//         }
//         else{
//             reject(new Error(`not a applicationHeader`));
//         }
//         setTimeout((reject) => {
//             reject(undefined);
//         }, 500,reject);
//     });
// };

// const hashDataAndAppendFakeHeader = (
//     rawData: Buffer,
//     tlsApplicationDataHeader: Buffer,
//     algorithm: string,
//     cipherKey: string | Buffer,
// ): Promise<Buffer> => {
//     return new Promise<Buffer>((resolve, reject) => {
//         const hmac  = createHmac(algorithm, cipherKey);
//         const hashedData = hmac.update(rawData).digest();
//         const applicationDataLength = rawData.byteLength + hashedData.byteLength;
//         const applicationDataLengthValue = Buffer.from([((applicationDataLength)>>8)&0xff,(applicationDataLength)&0xff]);
//         const concatData = Buffer.concat([tlsApplicationDataHeader, applicationDataLengthValue, hashedData, rawData ]);
//         resolve(concatData);
//         setTimeout((reject) => {
//             reject(undefined);
//         }, 500,reject);
//     });
// };

// export {hashDataAndAppendFakeHeader, decryptDataAndRemoveFakeHeader}
export {Mixer}