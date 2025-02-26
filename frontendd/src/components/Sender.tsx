import { useEffect, useState } from "react"

export function Sender(){
    const [socket,setSocket] = useState<WebSocket | null>(null)
    useEffect(()=>{
        const socket = new WebSocket('ws://localhost:8080')
        socket.onopen=()=>{
            socket.send(JSON.stringify({
                type:"identify-as-sender"
            }))

        }
        setSocket(socket)
    },[])

    async function startSendingVideo(){
        if(!socket) return;
        //create an rtcpeer connection
        const pc = new RTCPeerConnection();
        //create an offer now
        const offer = await pc.createOffer(); //sdp
        //set local description to offer
        await pc.setLocalDescription(offer);
        //add event listener for ice candidates
        pc.onicecandidate=(event)=>{
            console.log("ice candidate");
            if(event.candidate){
                socket?.send(JSON.stringify({
                    type:"ice-candidate",
                    candidate:event.candidate
                }))
            }
        }
        //send offer to receiver through signaling server
        socket?.send(JSON.stringify({
            type:"create-offer",
            offer:pc.localDescription
        }))
        socket.onmessage=(event)=>{
            const data = JSON.parse(event.data)
            if(data.type==="answer"){
                pc.setRemoteDescription(data.answer)
            }
            else if(data.type==="ice-candidate"){
                //@ts-ignore
                pc.addIceCandidate(data.candidate)
            }
        }

    }
    return(
        <div>
            <h1>Sender</h1>
            <button onClick={startSendingVideo}>Send video</button>
        </div>
    )
}
