import { useEffect, useRef, useState } from "react"
import '../styles/MediaControls.css'

export const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');
        setSocket(ws);
        
        ws.onopen = () => {
            setIsConnected(true);
            ws.send(JSON.stringify({ type: 'sender' }));
        }

        ws.onclose = () => {
            setIsConnected(false);
        }

        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        setPC(peerConnection);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        }

        ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createAnswer') {
                await peerConnection.setRemoteDescription(message.sdp);
            } else if (message.type === 'iceCandidate') {
                await peerConnection.addIceCandidate(message.candidate);
            }
        }

        return () => {
            ws.close();
            peerConnection.close();
        }
    }, []);

    const toggleCamera = async () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOn(!isCameraOn);
        }
    };

    const toggleMic = async () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMicOn(!isMicOn);
        }
    };

    const initiateConn = async () => {
        if (!socket || !pc) {
            alert("Connection not ready");
            return;
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: true,
                audio: true 
            });
            setStream(mediaStream);
            setIsCameraOn(true);
            setIsMicOn(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            mediaStream.getTracks().forEach((track) => {
                pc.addTrack(track, mediaStream);
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.send(JSON.stringify({
                type: 'createOffer',
                sdp: pc.localDescription
            }));
        } catch (err) {
            console.error("Error setting up connection:", err);
            alert("Failed to setup connection");
        }
    }

    return (
        <div className="media-container">
            <div className="status-bar">
                <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
            
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="video-preview"
            />

            <div className="controls">
                <button 
                    onClick={toggleCamera} 
                    className={`control-btn ${isCameraOn ? 'active' : ''}`}
                    disabled={!stream}
                >
                    {isCameraOn ? '🎥' : '❌'} Camera
                </button>
                <button 
                    onClick={toggleMic} 
                    className={`control-btn ${isMicOn ? 'active' : ''}`}
                    disabled={!stream}
                >
                    {isMicOn ? '🎤' : '🔇'} Mic
                </button>
                <button 
                    onClick={initiateConn}
                    className="start-btn"
                    disabled={!isConnected || stream !== null}
                >
                    Start Streaming
                </button>
            </div>
        </div>
    )
}