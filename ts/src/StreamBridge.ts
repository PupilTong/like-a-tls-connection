import { Duplex, Transform } from "stream";

class StreamBridge{
    public readonly socket0 : Duplex;
    public readonly socket1 : Duplex;
    constructor(){
        const socket0 = new Transform();
        const socket1 = new Transform();
        socket0._transform = (chunk, encoding, cb)=>{
            socket1.emit('data',chunk);
        }
        socket1._transform = (chunk, encoding, cb)=>{
            socket0.emit('data', chunk);
        }
        socket0._destroy = (err)=>{
            socket1.destroy(err);
        }
        socket1._destroy = (err)=>{
            socket0.destroy(err);
        }
        this.socket0 = socket0;
        this.socket1 = socket1;
    }
    destroy(){
        this.socket0.destroy();
        this.socket1.destroy()
    }
}
export { StreamBridge}