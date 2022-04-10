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

    it("test two packets",(done)=>{
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03]
        let count = 0;
        parser.on('data',(data)=>{
            should.equal(Buffer.compare(data, Buffer.from(data)),0);
            count++;
            if(count==2){
                done();
            }
        })
        parser.write(Buffer.from(data))
        parser.write(Buffer.from(data))
    })

    it("test one fragmented packets",(done)=>{
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03]
        parser.on('data',(data)=>{
            should.equal(Buffer.compare(data, Buffer.from(data)),0);
            done();
        })
        data.forEach((value)=>{
            parser.write(Buffer.from([value]))
        })
    })


    it("test two fragmented packets",(done)=>{
        const data = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03]
        let count = 0;
        parser.on('data',(data)=>{
            should.equal(Buffer.compare(data, Buffer.from(data)),0);
            count++;
            if(count==2){
                done();
            }
        })
        for(let i=0;i<2;i++){
            data.forEach((value)=>{
                parser.write(Buffer.from([value]))
            })
        }
    })
    it("test three fragmented packets",(done)=>{
        const rawData = [0x17, 0x03, 0x03, 0x00, 0x03, 0x01, 0x02, 0x03]
        let count = 0;
        parser.on('data',(data)=>{
            should.equal(Buffer.compare(data, Buffer.from(data)),0);
            count+=data.byteLength;
            if(count== rawData.length*3){
                done();
            }
        })
        for(let i=0;i<3;i++){
            rawData.forEach((value)=>{
                parser.write(Buffer.from([value]))
            })
        }
    })
    afterEach(()=>{
        parser.destroy();
    })
})