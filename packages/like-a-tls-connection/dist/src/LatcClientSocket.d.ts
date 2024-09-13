/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Duplex } from "stream";
import * as tls from "tls";
interface LatcClientSocket extends Duplex {
    readonly port: number;
    readonly host: string;
    readonly hmacAlgorithm: "sha256" | "sha512";
    readonly salt: string;
    getHmacAlgorithm: () => "sha256" | "sha512";
    getSalt: () => string | Buffer;
    getFakeTlsSocket: () => tls.TLSSocket;
}
declare function createClientSocket(port: number, host: string, hmacAlgorithm: "sha256" | "sha512", salt: string | Buffer, fakeTlsSocketOption?: tls.ConnectionOptions): Promise<LatcClientSocket>;
export { createClientSocket, LatcClientSocket };
