
import { CipherCCMOptions, CipherCCMTypes, CipherGCM, CipherGCMOptions, CipherGCMTypes, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import * as tcp from 'net'
interface likeARealTlsOption {
    oneTimeEncryptKey: string,
    ivLength: number,
    algorithm: CipherGCMTypes,
    tlsApplicationDataHeader:Buffer,
    fakeDomain:string,
    fakeALPN?: string[],
    ca:Buffer,
    key?:Buffer,
    cert?:Buffer,
    aad:string | Buffer,
    authTagLength:number

}



const decryptDataAndRemoveFakeHeader = (
    rawData: Buffer,
    tlsApplicationDataHeader: Buffer,
    algorithm: CipherGCMTypes,
    cipherKey: string | Buffer,
    ivLength: number,
    aad:string | Buffer,
    authTagLength:number,
): Promise<Buffer | undefined> => {
    return new Promise<Buffer | undefined>((resolve, reject) => {
        
        const maybeApplicationHeader = rawData.subarray(0, tlsApplicationDataHeader.length);
        if (maybeApplicationHeader.compare(tlsApplicationDataHeader) === 0) {
            const maybeIv = rawData.subarray(
                tlsApplicationDataHeader.length + 2,
                ivLength + tlsApplicationDataHeader.length + 2
            );
            if (maybeIv.length === ivLength) {
                const maybeAuthTag = rawData.subarray(
                    tlsApplicationDataHeader.length + ivLength + 2,
                    tlsApplicationDataHeader.length + ivLength + authTagLength + 2
                )
                if(maybeAuthTag.length == authTagLength){
                    const decryption = createDecipheriv(algorithm, cipherKey, maybeIv , {
                        authTagLength:authTagLength,
                    });
                    decryption.setAuthTag(maybeAuthTag);
                    decryption.setAAD(Buffer.from(aad),{
                        plaintextLength: rawData.byteLength
                    })
                    const maybeEncryptedData = rawData.subarray(
                        tlsApplicationDataHeader.length + ivLength + authTagLength + 2, 
                        rawData.length
                    );
                    try{
                        const decryptedData = decryption.update(maybeEncryptedData);
                        decryption.final();
                        resolve(decryptedData);
                    }
                    catch (err){
                        reject(new Error(`Authentication failed! ${err}`))
                    }
                }
                else{
                    reject(new Error(`authTagLength length mismatch`));
                }
            }
            else{
                reject(new Error(`iv length mismatch`));
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

const encryptDataAndAppendFakeHeader = (
    rawData: Buffer,
    tlsApplicationDataHeader: Buffer,
    algorithm: CipherGCMTypes,
    cipherKey: string | Buffer,
    ivLength: number,
    aad:string | Buffer,
    authTagLength:number
): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
        const iv = randomBytes(ivLength);
        const encryption  = createCipheriv(algorithm, cipherKey, iv, {
            authTagLength:authTagLength,
        });
        encryption.setAutoPadding(true);
        encryption.setAAD(Buffer.from(aad),{
            plaintextLength: rawData.byteLength
        })
        const encryptedData = encryption.update(rawData);
        encryption.final();
        const authTag = encryption.getAuthTag();
        const applicationDataLength = iv.byteLength + encryptedData.byteLength + authTag.byteLength;
        const applicationDataLengthValue = Buffer.from([((applicationDataLength)>>8)&0xff,(applicationDataLength)&0xff]);
        const concatData = Buffer.concat([tlsApplicationDataHeader, applicationDataLengthValue, iv, authTag, encryptedData ]);
        resolve(concatData);
        setTimeout((reject) => {
            reject(undefined);
        }, 500,reject);
    });
};

export {likeARealTlsOption,encryptDataAndAppendFakeHeader, decryptDataAndRemoveFakeHeader}