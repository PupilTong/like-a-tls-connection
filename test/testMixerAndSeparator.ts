import should from 'should'
import { PassThrough } from 'stream';
import { Separator } from '../src/Separator.js';
import {Mixer} from '../src/Mixer.js';
describe("Test Mixer and Separator",()=>{
    let separator : Separator;
    let passThroughR : PassThrough;
    let labeledR : PassThrough;

    let mixer : Mixer;
    let passThroughW : PassThrough;
    let labeledW : PassThrough;
    beforeEach(()=>{
        passThroughR = new PassThrough();
        labeledR = new PassThrough();
        separator = new Separator("sha256", "salt", labeledR, passThroughR);

        passThroughW = new PassThrough();
        labeledW = new PassThrough();
        mixer = new Mixer("sha256","salt",labeledW,passThroughW)
        mixer.pipe(separator);
    })
    it("test passThrough",(done)=>{
        const message = "hello world"
        passThroughR.on('data',(data)=>{
            if(message == data){
                done();
            }
        })
        passThroughW.write(message);
    })


    it("test labeled",(done)=>{
        const message = "hello world"
        labeledR.on('data',(data)=>{
            if(message == data){
                done();
            }
        })
        labeledW.write(message);
    })


    it("test passThrough and labeled",(done)=>{
        const passThroughMsg = "hello passThrough"
        const LabeledMsg = "hello labeled"
        let count = 0;
        passThroughR.on('data',(data)=>{
            if(passThroughMsg == data){
                count ++ ;
                labeledR.on('data',(data)=>{
                    if(LabeledMsg == data){
                        count ++ ;
                        if(count==2){
                            done();
                        }
                    }
                })
            }
        })
        passThroughW.write(passThroughMsg);
        labeledW.write(LabeledMsg);
    })
    
    afterEach(()=>{
        separator.destroy();
        mixer.destroy();
        labeledR.destroy();
        passThroughR.destroy();
        labeledW.destroy();
        passThroughW.destroy();
    })
})