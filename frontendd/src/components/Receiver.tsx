import { useEffect, useRef, useState } from "react"
import '../styles/MediaControls.css'

export const Receiver = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(false);
    const [isRemoteMicOn, setIsRemoteMicOn] = useState(false);
    const [isLocalCameraOn, setIsLocalCameraOn] = useState(false);
    const [isLocalMicOn, setIsLocalMicOn] = useState(false);
    
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        socket.onopen = () => {
            setIsConnected(true);
            socket.send(JSON.stringify({ type: 'receiver' }));
        }

        socket.onclose = () => {
            setIsConnected(false);
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        }

        pc.ontrack = (event) => {
            if (videoRef.current) {
                const newStream = new MediaStream([event.track]);
                videoRef.current.srcObject = newStream;
                setRemoteStream(newStream);
                setIsRemoteCameraOn(event.track.kind === 'video');
                setIsRemoteMicOn(event.track.kind === 'audio');
            }
        }

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            try {
                if (message.type === 'createOffer') {
                    await pc.setRemoteDescription(message.sdp);
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.send(JSON.stringify({
                        type: 'createAnswer',
                        sdp: answer
                    }));
                } else if (message.type === 'iceCandidate') {
                    await pc.addIceCandidate(message.candidate);
                }
            } catch (err) {
                console.error("Error handling message:", err);
            }
        }

        return () => {
            socket.close();
            pc.close();
            localStream?.getTracks().forEach(track => track.stop());
        }
    }, []);

    const startLocalMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            
            setLocalStream(stream);
            setIsLocalCameraOn(true);
            setIsLocalMicOn(true);

            // Add tracks to peer connection
            stream.getTracks().forEach(track => {
                const pc = useRef<RTCPeerConnection | null>(null);
            });
        } catch (err) {
            console.error("Error accessing media devices:", err);
            alert("Failed to access camera/microphone");
        }
    };

    const toggleLocalCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsLocalCameraOn(!isLocalCameraOn);
        }
    };

    const toggleLocalMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsLocalMicOn(!isLocalMicOn);
        }
    };

    const toggleRemoteCamera = () => {
        if (remoteStream) {
            remoteStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsRemoteCameraOn(!isRemoteCameraOn);
        }
    };

    const toggleRemoteMic = () => {
        if (remoteStream) {
            remoteStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsRemoteMicOn(!isRemoteMicOn);
        }
    };

    return (
        <div className="media-container">
            <div className="status-bar">
                <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
            
            <div className="video-grid">
                <div className="video-wrapper">
                    <h3>Remote Stream</h3>
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="video-preview"
                    />
                    <div className="controls">
                        <button 
                            onClick={toggleRemoteCamera} 
                            className={`control-btn ${isRemoteCameraOn ? 'active' : ''}`}
                            disabled={!remoteStream}
                        >
                            {isRemoteCameraOn ? '🎥' : '❌'} Remote Camera
                        </button>
                        <button 
                            onClick={toggleRemoteMic} 
                            className={`control-btn ${isRemoteMicOn ? 'active' : ''}`}
                            disabled={!remoteStream}
                        >
                            {isRemoteMicOn ? '🎤' : '🔇'} Remote Mic
                        </button>
                    </div>
                </div>

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
                            onClick={startLocalMedia} 
                            className="start-btn"
                            disabled={!isConnected || localStream !== null}
                        >
                            Start Camera
                        </button>
                        <button 
                            onClick={toggleLocalCamera} 
                            className={`control-btn ${isLocalCameraOn ? 'active' : ''}`}
                            disabled={!localStream}
                        >
                            {isLocalCameraOn ? '🎥' : '❌'} Camera
                        </button>
                        <button 
                            onClick={toggleLocalMic} 
                            className={`control-btn ${isLocalMicOn ? 'active' : ''}`}
                            disabled={!localStream}
                        >
                            {isLocalMicOn ? '🎤' : '🔇'} Mic
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}