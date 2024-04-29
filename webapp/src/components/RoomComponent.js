// RoomComponent.js
import React, { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';
import styles from './RoomComponent.module.css';

const RoomComponent = ({ roomData }) => {
    const [searchActive, setSearchActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);  // State to track loading

    // Function to fetch search results
    const fetchSearchResults = async (query) => {
        setIsLoading(true);  // Set loading true when search starts
        const response = await fetch(`/api/search?query=${query}`);
        const data = await response.json();
        setIsLoading(false);  // Set loading false when fetching completes
        if (response.ok) {
            setSearchResults(data.tracks.items);  // Assuming 'tracks.items' is the structure returned by Spotify
        } else {
            console.error('Failed to fetch search results:', data.error);
            setSearchResults([]);
        }
    };

    // Debounced search function
    const debouncedSearch = useCallback(debounce(fetchSearchResults, 300), []);

    // Event handler for search input changes
    const handleSearchChange = (event) => {
        const query = event.target.value;
        setSearchTerm(query);
        if (query.length > 0) {
            debouncedSearch(query);
        } else {
            setSearchResults([]);
        }
    };

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
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={`${styles.searchInput} ${styles.stickySearch}`}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    style={{ backgroundColor: searchActive ? '#fff' : '#eee' }}
                />
                {isLoading && <div className={styles.loadingSpinner}>Loading...</div>}
                <div className={styles.trackListContainer}>
                    {searchResults.length > 0 && (
                        <ul className={styles.trackList}>
                            {searchResults.map((track, index) => (
                                <li key={index} className={styles.track}>
                                    <img src={track.album.images.slice(-1)[0].url} alt="Album Cover" className={styles.albumImage} />
                                    {track.name} - {track.artists.map(artist => artist.name).join(', ')}
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
