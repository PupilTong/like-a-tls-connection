import * as tls from 'tls'
import log from 'standard-log'
import { fstat, readFileSync, readSync } from 'fs';
const debug = true;
const logger = log.getLogger('client');
const tempServer = tls.createServer({
    ALPNProtocols:['h2'],
    enableTrace:debug,
    sessionTimeout:300,
    ca:readFileSync('dist/cert/ca.crt'),
    key:readFileSync('dist/cert/server.key'),
    cert:readFileSync('dist/cert/server.crt')
},(tlsSocket)=>{
})
tempServer.listen(8443,'localhost',0,()=>{
    logger.info(`server listening`);
    const tempClient = tls.connect({
        enableTrace:debug,
        host:'localhost',
        port:8443,
        rejectUnauthorized:true,
        ALPNProtocols: ['h2','http/1.1'],
        ciphers:`ECDHE-ECDSA-AES256-GCM-SHA384`,
        ca:readFileSync('dist/cert/ca.crt')
    },()=>{
        tempClient.disableRenegotiation();
        const clientTicket = tempClient.getSession()
        const serverTicket = tempServer.getTicketKeys();
        logger.info(`successfully connected`);

        // try to resume tunnel

        
        const tempServer2 = tls.createServer({
            ALPNProtocols:['h2'],
            enableTrace:debug,
            sessionTimeout:300,
            ca:readFileSync('dist/cert/ca.crt'),
            key:readFileSync('dist/cert/server.key'),
            cert:readFileSync('dist/cert/server.crt'),
            ticketKeys:serverTicket
        })
        tempServer2.listen(8444,'127.0.0.1',()=>{
            const tempClient2 = tls.connect({
                enableTrace:debug,
                host:'127.0.0.1',
                port:8444,
                rejectUnauthorized:true,
                ALPNProtocols: ['h2','http/1.1'],
                ciphers:`ECDHE-ECDSA-AES256-GCM-SHA384`,
                ca:readFileSync('dist/cert/ca.crt'),
                session:clientTicket
                
            },()=>{
                logger.info(`resume success!`)
            })
        })
    });
});
tempServer.on('tlsClientError',(err)=>{
    console.log(err);
})