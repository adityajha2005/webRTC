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
            let pc:RTCPeerConnection | null = null;
            const message = JSON.parse(event.data)
            if(message.type==="offer"){
                //receive offer from sender (signaling server)
                pc = new RTCPeerConnection();
                //set remote description to offer
                pc.setRemoteDescription(message.offer)
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
                //create an answer
                const answer = await pc.createAnswer();
                //set local description to answer
                await pc.setLocalDescription(answer);
                //send answer to sender through signaling server
                socket.send(
                    JSON.stringify({
                        type:"create-answer",
                        answer:pc.localDescription
                    })
                )
            
            } else if(message.type==="ice-candidate"){
                if(pc !==null){
                    //@ts-ignore
                    pc.addIceCandidate(message.candidate)
                }
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
