
import { createHmac } from 'crypto';
import * as tcp from 'net'
interface likeARealTlsOption extends tcp.TcpNetConnectOpts {
    oneTimehashKey: string,
    algorithm: string,
    tlsApplicationDataHeader:Buffer,
    fakeDomain:string,
    fakeALPN?: string[],
}



const decryptDataAndRemoveFakeHeader = (
    rawData: Buffer,
    tlsApplicationDataHeader: Buffer,
    algorithm: string,
    cipherKey: string | Buffer,
): Promise<Buffer | undefined> => {
    return new Promise<Buffer | undefined>((resolve, reject) => {
        
        const maybeApplicationHeader = rawData.subarray(0, tlsApplicationDataHeader.length);
        if (maybeApplicationHeader.compare(tlsApplicationDataHeader) === 0) {
            let hmac = createHmac(algorithm, cipherKey);
            const hashedDataLength = hmac.update('getLength').digest().byteLength;
            hmac = createHmac(algorithm, cipherKey);
            const maybeHashedData = rawData.subarray(
                tlsApplicationDataHeader.length + 2,
                tlsApplicationDataHeader.length + 2 + hashedDataLength
            );
            const maybeOriginalData = rawData.subarray(
                tlsApplicationDataHeader.length + 2 + hashedDataLength,
                rawData.byteLength
            );
            const hashedOriginalData = hmac.update(maybeOriginalData).digest();
            if(Buffer.compare(maybeHashedData, hashedOriginalData)===0){
                resolve(maybeOriginalData);
            }
            else{
                reject(new Error(`Authentication failed! hash doesn't match`))
            }
        }
        else{
            reject(new Error(`not a applicationHeader`));
        }
        setTimeout((reject) => {
            reject(undefined);
        }, 500,reject);
    });
};

const hashDataAndAppendFakeHeader = (
    rawData: Buffer,
    tlsApplicationDataHeader: Buffer,
    algorithm: string,
    cipherKey: string | Buffer,
): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
        const hmac  = createHmac(algorithm, cipherKey);
        const hashedData = hmac.update(rawData).digest();
        const applicationDataLength = rawData.byteLength + hashedData.byteLength;
        const applicationDataLengthValue = Buffer.from([((applicationDataLength)>>8)&0xff,(applicationDataLength)&0xff]);
        const concatData = Buffer.concat([tlsApplicationDataHeader, applicationDataLengthValue, hashedData, rawData ]);
        resolve(concatData);
        setTimeout((reject) => {
            reject(undefined);
        }, 500,reject);
    });
};

export {likeARealTlsOption,hashDataAndAppendFakeHeader, decryptDataAndRemoveFakeHeader}