import { useEffect } from "react"

export function Receiver(){
    useEffect(()=>{
        const socket = new WebSocket('ws://localhost:8080')
        socket.onopen=()=>{
            socket.send(JSON.stringify({
                type:"identify-as-receiver"
            }))   
        }
        socket.onmessage=async (event)=>{
            const message = JSON.parse(event.data)
            if(message.type==="offer"){
                //receive offer from sender (signaling server)
                const pc = new RTCPeerConnection();
                //set remote description to offer
                pc.setRemoteDescription(message.offer)
                //create an answer
                const answer = await pc.createAnswer();
                //set local description to answer
                await pc.setLocalDescription(answer);
                //send answer to sender through signaling server
                socket.send(
                    JSON.stringify({
                        type:"create-answer",
                        offer:pc.localDescription
                    })
                )
            }
        }
    },[])
    return(
        <div>
            <h1>Receiver</h1>
            <button>Receive video</button>
        </div>
    )
}
