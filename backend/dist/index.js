"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let senderSocket = null;
let receiverSocket = null;
wss.on("connection", function connection(ws) {
    ws.on('error', console.error);
    ws.on('message', function message(data) {
        const message = JSON.parse(data);
        //identify as sender
        //indetify as receiver
        //create offer
        //create answer
        //add ice candidate
        if (message.type === "identify-as-sender") {
            console.log("identify as sender");
            senderSocket = ws;
        }
        else if (message.type === "identify-as-receiver") {
            console.log("identify as receiver");
            receiverSocket = ws;
        }
        else if (message.type === "create-offer") {
            console.log("create offer");
            if (receiverSocket) {
                receiverSocket.send(JSON.stringify({
                    type: "offer",
                    offer: message.offer
                }));
            }
        }
        else if (message.type === "create-answer") {
            console.log("create answer");
            if (senderSocket) {
                senderSocket.send(JSON.stringify({
                    type: "answer",
                    answer: message.answer
                }));
            }
        }
        else if (message.type === "ice-candidate") {
            console.log("ice candidate");
            if (ws === senderSocket) {
                receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({
                    type: "ice-candidate",
                    candidate: message.candidate
                }));
            }
            else if (ws === receiverSocket) {
                senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({
                    type: "ice-candidate",
                    candidate: message.candidate
                }));
            }
        }
        console.log(message);
    });
    ws.send('something');
});
