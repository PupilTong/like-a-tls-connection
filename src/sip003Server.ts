#!/usr/bin/env node
import * as tcp from 'net'
import * as tls from 'net'
import log from 'standard-log'
import { readFileSync } from 'fs';
const logger = log.getLogger("sip003-server");

//get sip003 arguments
const localServerAddr = process.env['SS_LOCAL_HOST'];
const localServerPort = parseInt(process.env['SS_LOCAL_PORT'],10);
const remoteServerAddr = process.env['SS_REMOTE_HOST'];
const remoteServerPort = parseInt(process.env['SS_REMOTE_PORT'],10);

const pluginRawArgs = process.env['SS_PLUGIN_OPTIONS']?.split(';');
const pluginArgs = new Map<string, string>();
pluginRawArgs?.forEach(arg => {
    const argPair = arg.split('=');
    if (argPair.length == 2) {
        pluginArgs.set(argPair[0], argPair[1]);
    }
});

const hashKey = pluginArgs.get('hashKey');
const algorithm = pluginArgs.get('algorithm');
const fakeDomain = pluginArgs.get('fakeDomain');


if (typeof (localServerAddr &&
            localServerPort && 
            remoteServerAddr && 
            remoteServerPort && 
            hashKey && 
            algorithm && 
            fakeDomain) === 'undefined') {
    throw Error(`invalid arguments`);
}
logger.info(`received env local: ${localServerAddr}:${localServerPort} remote:${remoteServerAddr}:${remoteServerPort} `)
logger.info(`received argument: ${hashKey}:${algorithm}:${fakeDomain}`)

//On the server, SS_REMOTE_HOST:SS_REMOTE_PORT is the address of the plugin-server listening on the outbound interface

const options = {
    ca:readFileSync('dist/cert/ca.crt'),
    key:readFileSync('dist/cert/server.key'),
    cert:readFileSync('dist/cert/server.crt'),
    fakeALPN:['h2', 'http/1.1']
}
const tlsServer = tls.createServer({
},(tlsSocket) =>{
    logger.info(`sip plugin forwarding to ${localServerAddr}:${localServerPort}`)
    const socketToSS = tcp.connect(localServerPort,localServerAddr,()=>{
        tlsSocket.pipe(socketToSS);
        socketToSS.pipe(tlsSocket);
    })
    socketToSS.on('error',(err)=>{
        tlsSocket.destroy();
        logger.emergency(`ss-server closed socket`)
    })
    // tcpServer.emit('connection')
});
logger.info(`local Server listening on ${remoteServerPort}:${remoteServerAddr}`);
tlsServer.listen(remoteServerPort,remoteServerAddr);