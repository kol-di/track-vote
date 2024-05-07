import RoomComponent from '../../components/RoomComponent';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export async function getServerSideProps(context) {
    const { id } = context.params;
    const baseUrl = process.env.BASE_URL;
    const res = await fetch(`${baseUrl}/api/rooms/${id}`);
    if (!res.ok) {
        return { props: { roomData: null } };
    }
    const data = await res.json();
    if (data.tracks && data.tracks.length > 0) {
        data.tracks.sort((a, b) => b.votes - a.votes);
    }
    return { props: { roomData: data } };
}

const RoomPage = ({ roomData }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!roomData) return;
    
        const newSocket = io(process.env.NEXT_PUBLIC_WEB_APP_BASE_URL, {
            query: { roomId: roomData.id }, 
            transports : ["websocket"]
        });
    
        newSocket.on('connect', () => {
            console.log('Connected to Socket.IO');
            newSocket.emit('joinRoom', roomData.id); // Join the room
        });

        newSocket.on('connect_error', (err) => {
            console.log('Error connecting to Socket.IO:', err);
          });
    
        setSocket(newSocket);
    
        return () => {
            newSocket.close();
            console.log('Disconnected Socket.IO');
        };
    }, [roomData]);

    if (!roomData) return <p>Room not found.</p>;
    return <RoomComponent roomData={roomData} socket={socket} />;
}

export default RoomPage;
