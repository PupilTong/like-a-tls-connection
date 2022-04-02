import { Duplex, Transform } from "stream";
import * as tls from 'tls'
import * as tcp from 'net'
import { LatcSocket } from "./latcSocket";
class latcServer extends tcp.Server{
    constructor(){
        super()
    }
    addListener(event: string, listener: (...args: any[]) => void): this;
    addListener(event: "close", listener: () => void): this;
    addListener(event: "connection", listener: (socket: LatcSocket) => void): this;
    addListener(event: "error", listener: (err: Error) => void): this;
    addListener(event: "listening", listener: () => void): this;
    addListener(event: unknown, listener: unknown): this {
        throw new Error("Method not implemented.");
    }
    emit(event: string | symbol, ...args: any[]): boolean;
    emit(event: "close"): boolean;
    emit(event: "connection", socket: LatcSocket): boolean;
    emit(event: "error", err: Error): boolean;
    emit(event: "listening"): boolean;
    emit(event: unknown, err?: unknown, ...rest?: unknown[]): boolean {
        throw new Error("Method not implemented.");
    }
    on(event: string, listener: (...args: any[]) => void): this;
    on(event: "close", listener: () => void): this;
    on(event: "connection", listener: (socket: LatcSocket) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "listening", listener: () => void): this;
    on(event: unknown, listener: unknown): this {
        throw new Error("Method not implemented.");
    }
    once(event: string, listener: (...args: any[]) => void): this;
    once(event: "close", listener: () => void): this;
    once(event: "connection", listener: (socket: LatcSocket) => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    once(event: "listening", listener: () => void): this;
    once(event: unknown, listener: unknown): this {
        throw new Error("Method not implemented.");
    }
    prependListener(event: string, listener: (...args: any[]) => void): this;
    prependListener(event: "close", listener: () => void): this;
    prependListener(event: "connection", listener: (socket: LatcSocket) => void): this;
    prependListener(event: "error", listener: (err: Error) => void): this;
    prependListener(event: "listening", listener: () => void): this;
    prependListener(event: unknown, listener: unknown): this {
        throw new Error("Method not implemented.");
    }
    prependOnceListener(event: string, listener: (...args: any[]) => void): this;
    prependOnceListener(event: "close", listener: () => void): this;
    prependOnceListener(event: "connection", listener: (socket: LatcSocket) => void): this;
    prependOnceListener(event: "error", listener: (err: Error) => void): this;
    prependOnceListener(event: "listening", listener: () => void): this;
    prependOnceListener(event: unknown, listener: unknown): this {
        throw new Error("Method not implemented.");
    }
    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        throw new Error("Method not implemented.");
    }
    off(eventName: string | symbol, listener: (...args: any[]) => void): this {
        throw new Error("Method not implemented.");
    }
    removeAllListeners(event?: string | symbol): this {
        throw new Error("Method not implemented.");
    }
    setMaxListeners(n: number): this {
        throw new Error("Method not implemented.");
    }
    getMaxListeners(): number {
        throw new Error("Method not implemented.");
    }
    listeners(eventName: string | symbol): Function[] {
        throw new Error("Method not implemented.");
    }
    rawListeners(eventName: string | symbol): Function[] {
        throw new Error("Method not implemented.");
    }
    listenerCount(eventName: string | symbol): number {
        throw new Error("Method not implemented.");
    }
    eventNames(): (string | symbol)[] {
        throw new Error("Method not implemented.");
    }
    
}