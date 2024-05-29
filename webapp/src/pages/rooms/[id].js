import RoomComponent from '../../components/RoomComponent';
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import absoluteUrl from 'next-absolute-url';


export async function getServerSideProps(context) {
    console.log('Inside getServerSideProps');
    const { req } = context;
    const { origin } = absoluteUrl(req);
    const { id } = context.params;
    console.log('Will fetch data at origin', origin);
    const res = await fetch(`http://localhost:3000/api/rooms/${id}`);
    if (!res.ok) {
        return { props: { roomData: null } };
    }
    const data = await res.json();
    if (data.tracks && data.tracks.length > 0) {
        data.tracks.sort((a, b) => b.votes - a.votes);
    }
    console.log('about to return roomData');
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
            console.log('about to initalise telegram');
            initializeTelegram();
            console.log('Initialised telegram');
        }
    
        console.log('About to create new socket client, public url is', process.env.NEXT_PUBLIC_URL);
        const newSocket = socketClient(process.env.NEXT_PUBLIC_URL, {
            path: '/ws',
            query: { roomId: roomData.id }, 
            transports : ["websocket"]
        });
        console.log('Created new socekt client');
    
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
