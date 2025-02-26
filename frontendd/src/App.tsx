import { useState } from 'react';
import { VideoCall } from './components/VideoCall';
import './styles/MediaControls.css';

function App() {
    const [role, setRole] = useState<'sender' | 'receiver' | null>(null);

    if (!role) {
        return (
            <div className="role-selection">
                <h1>Select Your Role</h1>
                <button onClick={() => setRole('sender')}>Join as Sender</button>
                <button onClick={() => setRole('receiver')}>Join as Receiver</button>
            </div>
        );
    }

    return <VideoCall role={role} />;
}

export default App;
