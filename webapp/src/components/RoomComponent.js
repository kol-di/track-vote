import React, { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';
import styles from './RoomComponent.module.css';

const RoomComponent = ({ roomData }) => {
    const [searchActive, setSearchActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSearchResults = async (query) => {
        setIsLoading(true);
        const response = await fetch(`/api/search?query=${query}`);
        const data = await response.json();
        setIsLoading(false);
        if (response.ok) {
            setSearchResults(data.tracks.items);
        } else {
            console.error('Failed to fetch search results:', data.error);
            setSearchResults([]);
        }
    };

    const debouncedSearch = useCallback(debounce(fetchSearchResults, 300), []);

    const handleSearchChange = (event) => {
        const query = event.target.value;
        setSearchTerm(query);
        if (query.length > 0) {
            debouncedSearch(query);
        } else {
            setSearchResults([]);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.roomNameContainer}>
                <h1 className={styles.roomName}>{roomData.roomName}</h1>
            </div>
            <div className={styles.subLayer}>
                <div className={styles.searchInputContainer}>
                    <input
                        type="text"
                        placeholder="Search tracks..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className={`${styles.searchInput} ${styles.stickySearch}`}
                        onFocus={() => setSearchActive(true)}
                        onBlur={() => setSearchActive(false)}
                        style={{ backgroundColor: searchActive ? '#fff' : '#eee' }}
                    />
                    {isLoading && <div className={styles.loadingSpinner}></div>}
                </div>
                <div className={styles.trackListContainer}>
                    {searchResults.length > 0 && (
                        <ul className={styles.trackList}>
                            {searchResults.map((track, index) => (
                                <li key={index} className={styles.trackItem}>
                                    <img src={track.album.images.slice(-1)[0].url} alt="Album Cover" className={styles.albumImage} />
                                    <div className={styles.trackInfo}>
                                        <div className={styles.artistName}>{track.artists.map(artist => artist.name).join(', ')}</div>
                                        <div className={styles.trackName}>{track.name}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomComponent;
