import React, { useEffect } from 'react';
import styles from './RoomComponent.module.css'; // Import CSS module (create this file next)

const RoomComponent = ({ roomData }) => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.roomName}>{roomData.roomName}</h1>
                <input type="text" placeholder="Search tracks..." className={styles.searchInput} />
            </header>
            <ul className={styles.adminList}>
                {roomData.admins.map((admin, index) => (
                    <li key={index} className={styles.admin}>{admin}</li> // Display telegramId or other identifier
                ))}
            </ul>
            <div className={styles.trackListContainer}>
                <h2 className={styles.tracksTitle}>Tracks</h2>
                <ul className={styles.trackList}>
                    {roomData.tracks.map((track, index) => (
                        <li key={index} className={styles.track}>
                            Spotify ID: {track.spotifyId} - Votes: {track.votes}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default RoomComponent;
