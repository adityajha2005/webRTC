import { WebSocketServer, WebSocket } from "ws";
const wss = new WebSocketServer({ port : 8080 });
let senderSocket: null| WebSocket = null;
let receiverSocket: null| WebSocket = null;

wss.on("connection",function connection(ws){
    ws.on('error', console.error);

    ws.on('message', function message(data:any){
        const message = JSON.parse(data);
        //identify as sender
        //indetify as receiver
        //create offer
        //create answer
        //add ice candidate
        if(message.type==="identify-as-sender"){
            console.log("identify as sender");
            senderSocket=ws;
        }
        else if(message.type==="identify-as-receiver"){
            console.log("identify as receiver");
            receiverSocket=ws;  
        }
        else if(message.type==="create-offer"){
            console.log("create offer");
            if (receiverSocket) {
                receiverSocket.send(JSON.stringify({
                    type:"offer",
                    offer:message.offer
                }))
            }
        }
        else if(message.type==="create-answer"){
            console.log("create answer");
            if(senderSocket){
                senderSocket.send(JSON.stringify({
                    type:"answer",
                    answer:message.answer
                }))
            }
        }
        else if(message.type==="ice-candidate"){
            console.log("ice candidate");
            if(ws===senderSocket){
                receiverSocket?.send(JSON.stringify({
                    type:"ice-candidate",
                    candidate:message.candidate
                }))
            }
            else if(ws===receiverSocket){
                senderSocket?.send(JSON.stringify({
                    type:"ice-candidate",
                    candidate:message.candidate
                }))
            }
        }
        console.log(message);
    });

    ws.send('something');
})