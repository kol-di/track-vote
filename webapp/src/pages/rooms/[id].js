import RoomComponent from '../../components/RoomComponent';
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';


export async function getServerSideProps(context) {
    const { id } = context.params;
    const res = await fetch(`http://localhost:3000/api/rooms/${id}`);
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
    const [currentVoteId, setCurrentVoteId] = useState(null);

    useEffect(() => {
        if (!roomData) return;

        const initializeTelegram = async () => {
            if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
                const telegramUserId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
                setIsAdmin(roomData.admins.includes(telegramUserId));

                // Fetch the current vote for the user
                try {
                    const response = await fetch(`/api/users/${telegramUserId}/currentVote?telegramId=${telegramUserId}&roomId=${roomData.id}`);
                    const data = await response.json();

                    if (response.ok && data.spotifyId) {
                        setCurrentVoteId(data.spotifyId);
                        console.log('received currentVoteId from api', data.spotifyId);
                    }
                } catch (error) {
                    console.error('Failed to fetch current vote:', error);
                }
            }
            window.Telegram.WebApp.ready();
        };

        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            initializeTelegram();
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
    return <RoomComponent roomData={roomData} socket={socket} isAdmin={isAdmin} latestVoteId={currentVoteId} />;
}

export default RoomPage;
