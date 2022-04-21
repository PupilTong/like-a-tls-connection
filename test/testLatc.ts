import * as tcp from "net";
import * as tls from "tls";
import { createServerSocket } from "../src/LatcServerSocket.js";
import { createClientSocket } from "../src/LatcClientSocket.js";
import should from "should";
describe("Test Latc", () => {
    let tcpServer: tcp.Server;
    const fakeName = "www.icloud.com";
    beforeEach(function () {
        tcpServer = new tcp.Server();
        tcpServer.listen(2222, "127.0.0.1");
        this.timeout(6000);
    });

    it("request fake server cert", function (done) {
        tcpServer.once("connection", (serverSocket) => {
            createServerSocket(
                serverSocket,
                443,
                fakeName,
                "sha256",
                "salt",
            ).then((server) => {});
        });
        createClientSocket(2222, "127.0.0.1", "sha256", "salt", {
            servername: fakeName,
            rejectUnauthorized: true,
            // enableTrace:true,
            checkServerIdentity: (hostname, cert) => {
                const result = tls.checkServerIdentity(fakeName, cert);
                should.equal(result, undefined);
                done();
                return result;
            },
        }).then((socket) => {
            socket.on("error", () => {});
            socket.destroy();
        });
    });

    it("client to server", (done) => {
        const msg = "hello world";
        tcpServer.on("connection", (serverSocket) => {
            createServerSocket(
                serverSocket,
                443,
                fakeName,
                "sha256",
                "salt",
            ).then((server) => {
                server.once("data", (data) => {
                    if (data.toString() == msg) {
                        // server.destroy();
                        done();
                    }
                });
            });
        });
        createClientSocket(2222, "127.0.0.1", "sha256", "salt", {
            servername: fakeName,
            rejectUnauthorized: true,
        }).then((client) => {
            client.write(msg);
            client.destroy();
        });
    });

    it("catch an error while creating client", function (done) {
        createClientSocket(54321, "127.0.0.1", "sha256", "salt", {
            servername: fakeName,
            rejectUnauthorized: true,
        }).catch((e) => {
            done();
        });
    });

    it("server emitted close", (done) => {
        tcpServer.on("connection", (serverSocket) => {
            serverSocket.end();
        });
        createClientSocket(2222, "127.0.0.1", "sha256", "salt", {
            servername: fakeName,
            rejectUnauthorized: true,
        }).then((client) => {
            client.once('close',()=>{
                done();
            })
        });
    });
    afterEach(() => {
        tcpServer.close();
    });
});
