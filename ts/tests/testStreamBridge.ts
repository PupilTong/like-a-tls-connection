import should from 'should'
import { TLSSocket, connect } from 'tls';
import { StreamBridge } from "../src/StreamBridge.js";
import { TlsPacketParser } from '../src/TlsPacketParser.js';
describe("Test StreamBridge",()=>{
    let parser : StreamBridge;
    beforeEach(()=>{
        parser = new StreamBridge();
    })
    it("read and write 0",(done)=>{
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03]
        parser.socket1.on('data',(data)=>{
            should.equal(Buffer.compare(data, Buffer.from(data)),0);
            done();
        })
        parser.socket0.write(Buffer.from(data))
    })
    it("read and write 1",(done)=>{
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03]
        parser.socket0.on('data',(data)=>{
            should.equal(Buffer.compare(data, Buffer.from(data)),0);
            done();
        })
        parser.socket1.write(Buffer.from(data))
    })
    afterEach(()=>{
        parser.destroy();
    })
})