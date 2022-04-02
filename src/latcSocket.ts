import { Transform, Duplex } from 'stream';
import * as tls from 'tls'
import * as tcp from 'net'
import { Separator } from './Separator';


class LatcSocket extends Transform implements tcp.Socket  {
    private readonly sparator : Separator;
    private readonly 
    
    constructor(inValidDataStream:Duplex, validDataStream:Duplex){
        super({
            transform:(chunk,encoding,cb)=>{

            },
            flush: (cb)=>{

            }
        });
    }
    connect(options: tcp.SocketConnectOpts, connectionListener?: () => void): this;
    connect(port: number, host: string, connectionListener?: () => void): this;
    connect(port: number, connectionListener?: () => void): this;
    connect(path: string, connectionListener?: () => void): this;
    connect(port: unknown, host?: unknown, connectionListener?: unknown): this {
        throw new Error('Method not implemented.');
    }
    setTimeout(timeout: number, callback?: () => void): this {
        throw new Error('Method not implemented.');
    }
    setNoDelay(noDelay?: boolean): this {
        throw new Error('Method not implemented.');
    }
    setKeepAlive(enable?: boolean, initialDelay?: number): this {
        throw new Error('Method not implemented.');
    }
    address(): {} | tcp.AddressInfo {
        throw new Error('Method not implemented.');
    }
    unref(): this {
        throw new Error('Method not implemented.');
    }
    ref(): this {
        throw new Error('Method not implemented.');
    }
    bufferSize: number;
    bytesRead: number;
    bytesWritten: number;
    connecting: boolean;
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remoteFamily?: string;
    remotePort?: number;
}    
function createConnection(options: tcp.NetConnectOpts, connectionListener?: () => void): LatcSocket;
function createConnection(port: number, host?: string, connectionListener?: () => void): LatcSocket {
    const doTcpConnect = () : Promise<tcp.Socket> =>{
        return new Promise<tcp.Socket>((resolve, reject)=>{
            const tcpSocket = tcp.connect(port,host,()=>{
                logger.info(`established tcp connection to ${host}, local port ${tcpSocket.localPort}`);
                // tcpSocket.removeAllListeners('error');
                resolve(tcpSocket);
            });
            tcpSocket.on('error',(err)=>{
                logger.info(`tcp connection error : ${err}`);
                reject(err);
            })
        })
    }

}
export {createConnection,LatcSocket}