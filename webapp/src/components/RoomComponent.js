// RoomComponent.js
import React, { useState } from 'react';
import styles from './RoomComponent.module.css';

const RoomComponent = ({ roomData }) => {
    const [searchActive, setSearchActive] = useState(false);

    const handleSearchFocus = () => {
        setSearchActive(true);
    };

    const handleSearchBlur = () => {
        setSearchActive(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.roomNameContainer}>
                <h1 className={styles.roomName}>{roomData.roomName}</h1>
            </div>
            <div className={styles.subLayer}>
                <input
                    type="text"
                    placeholder="Search tracks..."
                    className={`${styles.searchInput} ${styles.stickySearch}`}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    style={{ backgroundColor: searchActive ? '#fff' : '#eee' }}
                />
                <div className={styles.trackListContainer}>
                    <ul className={styles.trackList}>
                        {roomData.tracks.map((track, index) => (
                            <li key={index} className={styles.track}>
                                Spotify ID: {track.spotifyId} - Votes: {track.votes}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RoomComponent;
