import {Tun} from "tuntap2"
import WebSocket, { createWebSocketStream } from 'ws';

const tun = new Tun();
const ws = new WebSocket('wss://websocket-echo.com/');
const duplex = createWebSocketStream(ws, { encoding: 'utf8' });


tun.isUp = true;
tun.ipv4 = '10.100.0.1/24'
duplex.pipe(tun);