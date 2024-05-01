import React, { useState, useCallback, useRef, useEffect } from 'react';
import debounce from 'lodash/debounce';
import styles from './RoomComponent.module.css';

const RoomComponent = ({ roomData, socket }) => {
    const [searchActive, setSearchActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [topChart, setTopChart] = useState(roomData.tracks || []);  // Initialize with existing tracks
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    const fetchSearchResults = async (query) => {
        setIsLoading(true);
        const response = await fetch(`/api/search?query=${query}`);
        if (response.ok) {
            const data = await response.json();
            setSearchResults(data.tracks.items);
        } else {
            console.error('Failed to fetch search results:', response.status);
            setSearchResults([]);
        }
        setIsLoading(false);
    };

    const debouncedSearch = useCallback(debounce(fetchSearchResults, 300), []);

    const updateTopChart = (trackFromSpotify) => {
        // Prepare track data in the needed format
        const track = {
            spotifyId: trackFromSpotify.id,
            name: trackFromSpotify.name,
            artists: trackFromSpotify.artists.map(artist => artist.name),
            albumCoverUrl: trackFromSpotify.album.images[0].url,
            votes: trackFromSpotify.votes || 1
        };
    
        // Find the track in the current state to check if it exists
        const existingTrack = topChart.find(t => t.spotifyId === track.spotifyId);
        
        // If the track exists and we're supposed to add a vote
        if (existingTrack) {
            const updatedTrack = {
                ...existingTrack,
                votes: existingTrack.votes + 1 // Increment vote count
            };
            // Optimistically update the UI
            setTopChart(prev => [...prev.filter(t => t.spotifyId !== track.spotifyId), updatedTrack]);
            // Emit the update to the server with the current vote count
            socket.emit('updateTopChart', { roomId: roomData.id, track: { spotifyId: track.spotifyId, votes: updatedTrack.votes } });
        } else {
            // If the track does not exist in the local state, add it optimistically
            setTopChart(prev => [...prev, track]);
            // Emit the new track data to the server
            socket.emit('updateTopChart', { roomId: roomData.id, track });
        }
    };
    

    useEffect(() => {
        if (socket) {
            socket.on('topChartUpdated', (trackUpdate) => {
                setTopChart(prevTopChart => {
                    const existingTrackIndex = prevTopChart.findIndex(t => t.spotifyId === trackUpdate.spotifyId);
    
                    if (existingTrackIndex !== -1) {
                        // Track already exists in the top chart
                        if (trackUpdate.votes === 0) {
                            // If votes are zero, remove the track
                            return prevTopChart.filter(t => t.spotifyId !== trackUpdate.spotifyId);
                        } else {
                            // Update vote count
                            const updatedTopChart = [...prevTopChart];
                            updatedTopChart[existingTrackIndex] = {
                                ...updatedTopChart[existingTrackIndex],
                                votes: trackUpdate.votes
                            };
                            return updatedTopChart;
                        }
                    } else if (trackUpdate.votes > 0) {
                        // Track does not exist and has votes greater than zero, add it
                        return [...prevTopChart, {
                            spotifyId: trackUpdate.spotifyId,
                            name: trackUpdate.name,
                            artists: trackUpdate.artists,
                            albumCoverUrl: trackUpdate.albumCoverUrl,
                            votes: trackUpdate.votes
                        }];
                    }
    
                    return prevTopChart; // Return the current state if no changes
                });
            });
    
            return () => socket.off('topChartUpdated');
        }
    }, [socket]);

    const handleSearchChange = (event) => {
        const query = event.target.value;
        setSearchTerm(query);
        if (query.length > 0) {
            debouncedSearch(query);
        } else {
            setSearchResults([]);
        }
    };

    const handleFocus = () => {
        setSearchActive(true);
        // Scroll to make the searchContainerRef top align with the top of the viewport
        if (searchContainerRef.current) {
            window.scrollTo({
                top: searchContainerRef.current.offsetTop,
                behavior: 'smooth'
            });
        }
        if (searchTerm) {
            debouncedSearch(searchTerm);
        }
    };

    useEffect(() => {
        const handleTouchMove = () => {
            // Always blur the input field on touch move
            if (searchInputRef.current) {
                searchInputRef.current.blur();
            }
        };
    
        const container = document; // Listen on a broader scope, e.g., the whole document
        container.addEventListener('touchmove', handleTouchMove);
    
        return () => {
            container.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    const handleClickOutside = (event) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
            setSearchActive(false);
            setSearchResults([]);
        }
    };

    // Add event listener to handle clicks outside of the subLayer
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.roomNameContainer}>
                <h1 className={styles.roomName}>{roomData.roomName}</h1>
            </div>
            <div className={styles.subLayer}>
                <div ref={searchContainerRef} className={styles.searchContainer}>
                    <div className={styles.searchInputContainer}>
                        <input
                            type="text"
                            placeholder="Search tracks..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className={`${styles.searchInput}`}
                            onFocus={handleFocus}
                            ref={searchInputRef}
                            style={{ backgroundColor: searchActive ? '#fff' : '#eee' }}
                        />
                        {isLoading && <div className={styles.loadingSpinner}></div>}
                    </div>
                    {searchActive && searchResults.length > 0 && (
                        <div className={styles.resultsContainer}>
                            <ul className={styles.trackList}>
                                {searchResults.map((track, index) => (
                                    <li key={index} className={styles.trackItem} onClick={() => updateTopChart(track)}>
                                        <img src={track.album.images.slice(-1)[0].url} alt="Album Cover" className={styles.albumImage} />
                                        <div className={styles.trackInfo}>
                                            <div className={styles.artistName}>{track.artists.map(artist => artist.name).join(', ')}</div>
                                            <div className={styles.trackName}>{track.name}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                {topChart.length > 0 && (
                    <div className={styles.topChartContainer}>
                        <ul className={styles.trackList}>
                            {topChart.map((track) => (
                                <li key={track.spotifyId} className={styles.trackItem}>
                                    <img src={track.albumCoverUrl} alt="Album Cover" className={styles.albumImage} />
                                    <div className={styles.trackInfo}>
                                        <div className={styles.artistName}>{track.artists.join(', ')}</div>
                                        <div className={styles.trackName}>{track.name}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomComponent;
