import { TlsPacketParser } from "../src/TlsPacketParser.js";
import should from 'should'
describe("Test Tls PacketParser",()=>{
    let parser : TlsPacketParser;
    beforeEach(()=>{
        parser = new TlsPacketParser();
    })
    it("test one packet",(done)=>{
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03]
        parser.on('data',(data)=>{
            should.equal(Buffer.compare(data, Buffer.from(data)),0);
            done();
        })
        parser.write(Buffer.from(data))
    })
    afterEach(()=>{
        parser.destroy();
    })
})