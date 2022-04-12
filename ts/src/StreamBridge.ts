import { Duplex, Transform } from "stream";

class StreamBridge{
    public readonly socket0 : Duplex;
    public readonly socket1 : Duplex;
    constructor(){
        const socket0 = new Transform();
        const socket1 = new Transform();
        socket0._transform = (chunk, encoding, cb)=>{
            if(!socket1.push(chunk,encoding)){
                socket1.pause();
            }
        }
        socket1._transform = (chunk, encoding, cb)=>{
            if(!socket0.push(chunk,encoding)){
                socket0.pause();
            }
        }
        socket0._read = ()=>{
            socket1.resume();
        }
        socket1._read = ()=>{
            socket0.resume();
        }
        socket0.on('end',()=>{
            socket1.end();
        })
        socket1.on('end',()=>{
            socket0.end();
        })
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