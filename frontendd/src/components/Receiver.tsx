import { useEffect, useState } from "react"

export function Receiver(){
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);
    const [isReady, setIsReady] = useState(false);
    
    useEffect(() => {
        const newSocket = new WebSocket('ws://localhost:8080');
        
        newSocket.onopen = () => {
            newSocket.send(JSON.stringify({
                type: "identify-as-receiver"
            }));
            setSocket(newSocket);
        }
        
        // Clean up on unmount
        return () => {
            newSocket.close();
        }
    }, []);
    
    // Handle incoming messages
    useEffect(() => {
        if (!socket) return;
        
        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === "offer" && pc) {
                console.log("Received offer:", message.offer);
                
                // Set remote description to offer
                await pc.setRemoteDescription(message.offer);
                
                // Create an answer
                const answer = await pc.createAnswer();
                
                // Set local description to answer
                await pc.setLocalDescription(answer);
                
                // Send answer to sender through signaling server
                socket.send(JSON.stringify({
                    type: "create-answer",
                    answer: pc.localDescription
                }));
                
                setIsReady(true);
                console.log("Answer sent, connection ready");
            } else if (message.type === "ice-candidate" && pc) {
                console.log("Received ICE candidate");
                //@ts-ignore
                await pc.addIceCandidate(message.candidate);
            }
        }
    }, [socket, pc]);
    
    const receiveVideo = () => {
        if (!socket) {
            console.error("WebSocket not connected");
            return;
        }
        
        console.log("Setting up WebRTC connection...");
        
        // Create new RTCPeerConnection
        const newPc = new RTCPeerConnection();
        
        // Set up ICE candidate handling
        newPc.onicecandidate = (event) => {
            console.log("ICE candidate generated");
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: "ice-candidate",
                    candidate: event.candidate
                }));
            }
        };
        
        // Log connection state changes
        newPc.onconnectionstatechange = () => {
            console.log("Connection state:", newPc.connectionState);
        };
        
        // Store the peer connection
        setPc(newPc);
        
        console.log("Ready to receive offer");
    };
    
    return (
        <div>
            <h1>Receiver</h1>
            <button onClick={receiveVideo} disabled={!!pc}>
                {pc ? "Waiting for connection..." : "Receive video"}
            </button>
            {isReady && <p>Connection established!</p>}
        </div>
    );
}
