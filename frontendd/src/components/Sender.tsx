import { useEffect, useState } from "react"

export function Sender(){
    const [socket,setSocket] = useState<WebSocket | null>(null)
    useEffect(()=>{
        const socket = new WebSocket('ws://localhost:8080')
        socket.onopen=()=>{
            socket.send(JSON.stringify({
                type:"sender"
            }))

        }
    },[])

    async function startSendingVideo(){
        if(!socket) return;
        //create an rtcpeer connection
        const pc = new RTCPeerConnection();
        //create an offer now
        const offer = await pc.createOffer(); //sdp
        //set local description to offer
        await pc.setLocalDescription(offer);
        //send offer to receiver through signaling server
        socket?.send(JSON.stringify({
            type:"createOffer",
            sdp:pc.localDescription
        }))
        socket.onmessage=(event)=>{
            const data = JSON.parse(event.data)
            if(data.type==="createAnswer"){
                pc.setRemoteDescription(data.sdp)
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
