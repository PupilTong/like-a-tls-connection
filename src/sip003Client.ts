#!/usr/bin/env node
import * as tcp from 'net'
import log from 'standard-log'
import { exit } from 'process';
import { readFileSync } from 'fs';
import * as tls from 'tls';
const logger = log.getLogger("sip003-client");

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

const options = {
    ca:readFileSync('dist/cert/ca.crt'),
    key:readFileSync('dist/cert/server.key'),
    cert:readFileSync('dist/cert/server.crt'),
    fakeALPN:['h2', 'http/1.1']
}
const localServer = tcp.createServer((tcpSocketToSS)=>{
    tcpSocketToSS.on('error',err=>{
        logger.alert(`socket to local ss closed : ${err}`)
    })
    logger.info(`connecting to ${remoteServerAddr}:${remoteServerPort}`)
    const remoteTls = tls.connect({
        servername: fakeDomain,
        ALPNProtocols: options.fakeALPN,
        host: remoteServerAddr,
        port: remoteServerPort,
        ca:options.ca,
    },()=>{
        tcpSocketToSS.pipe(remoteTls)
        remoteTls.pipe(tcpSocketToSS);
    })
    
})
//On the client, SS_LOCAL_HOST:SS_LOCAL_PORT is the address of the plugin-local listening on the loopback
localServer.listen(localServerPort,localServerAddr,()=>{
    logger.info(`local Server listening on ${JSON.stringify(localServer.address())}`);
});
localServer.on('close',()=>{
    logger.alert(`local server closed`);
    exit(1);
})
localServer.on('error',()=>{
    logger.emergency(`error!`);
})

