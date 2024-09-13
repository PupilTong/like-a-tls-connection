/// <reference types="node" />
/// <reference types="node" />
import { Duplex } from "stream";
declare class LatcServerSocket extends Duplex {
    private readonly inBond;
    private readonly outBond;
    private readonly packetParser;
    private readonly separator;
    private readonly mixer;
    private readonly toClientSocket;
    private readonly toFakeServerSocket;
    private readonly hmacAlgorithm;
    private readonly salt;
    constructor(hmacAlgorithm: "sha256" | "sha512", salt: string | Buffer, toClientSocket: Duplex, toFakeServerSocket: Duplex);
    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error) => void): void;
    _destroy(error: Error, callback: (error: Error) => void): void;
    _read(size: number): void;
}
declare function createServerSocket(toClientSocket: Duplex, remoteFakeServerPort: number, remoteFakeServerHost: string, hmacAlgorithm: "sha256" | "sha512", salt: string | Buffer): Promise<LatcServerSocket>;
export { createServerSocket, LatcServerSocket };
