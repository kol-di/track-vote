import RoomComponent from '../../components/RoomComponent';
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import absoluteUrl from 'next-absolute-url';


export async function getServerSideProps(context) {
    const { req } = context;
    const { origin } = absoluteUrl(req);
    const { id } = context.params;
    const res = await fetch(`${origin}/api/rooms/${id}`);
    if (!res.ok) {
        return { props: { roomData: null } };
    }
    const data = await res.json();
    if (data.tracks && data.tracks.length > 0) {
        data.tracks.sort((a, b) => b.votes - a.votes);
    }
    return { props: { roomData: data } };
}

const RoomPage = ({ roomData, socketClient = io}) => {
    const [socket, setSocket] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!roomData) return;

        const initializeTelegram = () => {
            if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
                const telegramUserId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
                setIsAdmin(roomData.admins.includes(telegramUserId));
            }
            window.Telegram.WebApp.ready();
        };

        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            initializeTelegram();
        }
    
        const newSocket = socketClient(process.env.PUBLIC_URL, {
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
    }, [roomData, socketClient]);

    if (!roomData) return <p>Room not found.</p>;
    return <RoomComponent roomData={roomData} socket={socket} isAdmin={isAdmin} />;
}

export default RoomPage;
