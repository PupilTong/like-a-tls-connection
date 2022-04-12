import should from 'should'
import { StreamBridge } from "../src/StreamBridge.js";
import * as tls from 'tls'
import * as tcp from 'net'
describe("Test StreamBridge",()=>{
    let bridge : StreamBridge;
    beforeEach(()=>{
        bridge = new StreamBridge();
    })
    it("read and write 0",(done)=>{
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03]
        bridge.socket1.on('data',(data)=>{
            should.equal(Buffer.compare(data, Buffer.from(data)),0);
            done();
        })
        bridge.socket0.write(Buffer.from(data))
    })
    it("read and write 1",(done)=>{
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03]
        bridge.socket0.on('data',(data)=>{
            should.equal(Buffer.compare(data, Buffer.from(data)),0);
            done();
        })
        bridge.socket1.write(Buffer.from(data))
    })
    it("workable with tls",(done)=>{
        const tcpSocket = tcp.connect(443,'cn.bing.com',()=>{
            // tcpSocket.pipe(bridge.socket0);
            // bridge.socket0.pipe(tcpSocket);
            const tlsSocket = tls.connect({
                socket:tcpSocket,
                checkServerIdentity:(hostname,cert)=>{
                    const result = tls.checkServerIdentity(hostname, cert);
                    should.equal(result,undefined);
                    done();
                    tlsSocket.destroy();
                    return result;
                }
            })
        })
    })

    afterEach(()=>{
        bridge.destroy();
    })
})