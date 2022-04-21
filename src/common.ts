
import { CipherCCMOptions, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import * as tcp from 'net'
interface likeARealTlsOption {
    oneTimeEncryptKey: string,
    ivLength: number,
    algorithm: string,
    tlsApplicationDataHeader:Buffer,
    fakeDomain:string,
    fakeALPN?: string[],
    ca:Buffer,
    key?:Buffer,
    cert?:Buffer
}



const decryptDataAndRemoveFakeHeader = (
    rawData: Buffer,
    tlsApplicationDataHeader: Buffer,
    algorithm: string,
    cipherKey: string | Buffer,
    ivLength: number
): Promise<Buffer | undefined> => {
    return new Promise<Buffer | undefined>((resolve, reject) => {
        
        const maybeApplicationHeader = rawData.subarray(0, tlsApplicationDataHeader.length);
        if (maybeApplicationHeader.compare(tlsApplicationDataHeader) === 0) {
            const maybeIv = rawData.subarray(
                tlsApplicationDataHeader.length + 2,
                ivLength + tlsApplicationDataHeader.length + 2
            );
            if (maybeIv.length === ivLength) {
                const decryption = createDecipheriv(algorithm, cipherKey, maybeIv);
                decryption.on("data", (decryptedData: Buffer) => {
                    resolve(decryptedData);
                    decryption.destroy();
                });
                decryption.on("error", (err) => {
                    reject(err);
                    decryption.destroy();
                });
                decryption.write(
                    rawData.subarray(tlsApplicationDataHeader.length + ivLength + 2, rawData.length)
                );
            }
            else{
                reject(undefined);
            }
        }
        else{
            reject(undefined);
        }
        setTimeout((reject) => {
            reject(undefined);
        }, 500,reject);
    });
};

const encryptDataAndAppendFakeHeader = (
    rawData: Buffer,
    tlsApplicationDataHeader: Buffer,
    algorithm: string,
    cipherKey: string | Buffer,
    ivLength: number
): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
        const iv = randomBytes(ivLength);
        const encryption = createCipheriv(algorithm, cipherKey, iv);
        encryption.on("data", (data) => {
            const applicationDataLength = Buffer.from([((iv.length + data.length)>>8)&0xff,(iv.length + data.length)&0xff]);
            const encryptedData = Buffer.concat([tlsApplicationDataHeader, applicationDataLength, iv, data]);
            resolve(encryptedData);
            encryption.destroy();
        });
        encryption.on("error", (err) => {
            reject(err);
            encryption.destroy();
        });
        encryption.write(rawData);

        setTimeout((reject) => {
            reject(undefined);
        }, 500,reject);
    });
};

export {likeARealTlsOption,encryptDataAndAppendFakeHeader, decryptDataAndRemoveFakeHeader}