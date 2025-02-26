import { useEffect, useRef, useState } from "react"
import '../styles/MediaControls.css'

export const VideoCall = ({ role }: { role: 'sender' | 'receiver' }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isLocalCameraOn, setIsLocalCameraOn] = useState(false);
    const [isLocalMicOn, setIsLocalMicOn] = useState(false);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');
        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        setSocket(ws);
        setPC(peerConnection);

        ws.onopen = () => {
            setIsConnected(true);
            ws.send(JSON.stringify({ type: role }));
        }

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        }

        peerConnection.ontrack = (event) => {
            if (remoteVideoRef.current) {
                const stream = new MediaStream();
                event.streams[0].getTracks().forEach(track => {
                    stream.addTrack(track);
                });
                remoteVideoRef.current.srcObject = stream;
                setRemoteStream(stream);
            }
        }

        ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            try {
                if (message.type === 'createOffer') {
                    await peerConnection.setRemoteDescription(message.sdp);
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    ws.send(JSON.stringify({
                        type: 'createAnswer',
                        sdp: answer
                    }));
                } else if (message.type === 'createAnswer') {
                    await peerConnection.setRemoteDescription(message.sdp);
                } else if (message.type === 'iceCandidate') {
                    await peerConnection.addIceCandidate(message.candidate);
                }
            } catch (err) {
                console.error("Error handling message:", err);
            }
        }

        return () => {
            ws.close();
            peerConnection.close();
            localStream?.getTracks().forEach(track => track.stop());
        }
    }, [role]);

    const startLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            
            setLocalStream(stream);
            setIsLocalCameraOn(true);
            setIsLocalMicOn(true);

            stream.getTracks().forEach(track => {
                pc?.addTrack(track, stream);
            });

            if (role === 'sender') {
                const offer = await pc?.createOffer();
                await pc?.setLocalDescription(offer);
                socket?.send(JSON.stringify({
                    type: 'createOffer',
                    sdp: offer
                }));
            }
        } catch (err) {
            console.error("Error accessing media devices:", err);
            alert("Failed to access camera/microphone");
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsLocalCameraOn(!isLocalCameraOn);
        }
    };

    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsLocalMicOn(!isLocalMicOn);
        }
    };

    return (
        <div className="media-container">
            <div className="status-bar">
                <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'} ({role})
                </span>
            </div>
            
            <div className="video-grid">
                <div className="video-wrapper">
                    <h3>Local Stream</h3>
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted
                        className="video-preview"
                    />
                    <div className="controls">
                        <button 
                            onClick={startLocalStream} 
                            className="start-btn"
                            disabled={!isConnected || localStream !== null}
                        >
                            Start Stream
                        </button>
                        <button 
                            onClick={toggleCamera} 
                            className={`control-btn ${isLocalCameraOn ? 'active' : ''}`}
                            disabled={!localStream}
                        >
                            {isLocalCameraOn ? '🎥' : '❌'} Camera
                        </button>
                        <button 
                            onClick={toggleMic} 
                            className={`control-btn ${isLocalMicOn ? 'active' : ''}`}
                            disabled={!localStream}
                        >
                            {isLocalMicOn ? '🎤' : '🔇'} Mic
                        </button>
                    </div>
                </div>

                <div className="video-wrapper">
                    <h3>Remote Stream</h3>
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className="video-preview"
                        controls
                    />
                </div>
            </div>
        </div>
    )
}
