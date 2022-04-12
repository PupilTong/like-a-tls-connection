import * as tcp from 'net'
import * as tls from 'tls'
import { createServerSocket, LatcServerSocket } from '../src/LatcServerSocket.js'
import { createClientSocket, LatcClientSocket } from '../src/LatcClientSocket.js'
import should from 'should';
describe("Test Latc",()=>{
    let tcpServer : tcp.Server;
    const fakeName  = "cn.bing.com";
    beforeEach(async ()=>{
        tcpServer = new tcp.Server();
        tcpServer.listen(2222,'127.0.0.1');
    })
    it("client connect to server",(done)=>{
        tcpServer.on('connection',(serverSocket)=>{
            serverSocket.destroy()
            done()
        })
        createClientSocket(2222,'127.0.0.1',"sha256","salt",{
            servername:fakeName,
            rejectUnauthorized:true,
        }).then(client=>{
            client.on('error',()=>{});
        });
    })

    it("create server socket",(done)=>{
        tcpServer.on('connection',(serverSocket)=>{
            createServerSocket(serverSocket,443,fakeName,"sha256","salt").then(server=>{
                server.destroy();
                done();
            })
        })
        createClientSocket(2222,'127.0.0.1',"sha256","salt",{
            servername:fakeName,
            rejectUnauthorized:true,
        }).then(client=>{
            client.on('error',()=>{});
        });
    })


    it("request fake server cert",function(done){
        this.timeout(5000);
        tcpServer.on('connection',(serverSocket)=>{
            createServerSocket(serverSocket,443,fakeName,"sha256","salt").then(server=>{
            })
        })
        createClientSocket(2222,'127.0.0.1',"sha256","salt",{
            servername:fakeName,
            rejectUnauthorized:true,
            enableTrace:true,
            checkServerIdentity:(hostname,cert)=>{
                const result = tls.checkServerIdentity(hostname, cert);
                should.equal(result,undefined);
                done();
                return result;
            }
        });
    })


    // it("client to server",(done)=>{
    //     const msg = "hello world"
    //     tcpServer.on('connection',(serverSocket)=>{
    //         createServerSocket(serverSocket,443,fakeName,"sha256","salt").then(server=>{
    //             server.on('data',data=>{
    //                 if(data.toString() == msg){
    //                     // server.destroy();
    //                     done();
    //                 }
    //             })
    //         })
    //     })
    //     createClientSocket(2222,'127.0.0.1',"sha256","salt",{
    //         servername:fakeName,
    //         rejectUnauthorized:true,
    //     }).then(client=>{
    //         client.write(msg);
    //         client.destroy();
    //     });
    // })
    // createServerSocket(serverSocket,443,fakeName,"sha256","salt");
    // it("server",(done)=>{
    //     createServerSocket(tcpServerSocket, 443, fakeName, "sha256", "salt").then(server=>{
    //         createClientSocket(2222,'127.0.0.1',"sha256","salt",{
    //             servername:fakeName,
    //             rejectUnauthorized:true
    //         }).then(client=>{
    //             done();
    //         });
    //     })
    // })
    
    afterEach(()=>{
        tcpServer.close();
    })
})
