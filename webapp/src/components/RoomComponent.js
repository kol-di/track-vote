import React, { useState, useCallback, useRef, useEffect } from 'react';
import debounce from 'lodash/debounce';
import styles from './RoomComponent.module.css';
import { trackSchema } from '../schemas/roomSchemas.js';
import Image from 'next/image';


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
            const enhancedTracks = data.tracks.items.map(track => {
                const existingTrack = topChart.find(t => t.spotifyId === track.id);
                return {
                    ...track,
                    votes: existingTrack ? existingTrack.votes : 0
                };
            });
            setSearchResults(enhancedTracks);
        } else {
            console.error('Failed to fetch search results:', response.status);
            setSearchResults([]);
        }
        setIsLoading(false);
    };

    const debouncedSearch = debounce(query => fetchSearchResults(query), 300);
    
    const updateTopChart = async (trackFromSpotify) => {
        // Clear search results once a track is clicked
        setSearchResults([]);

        // Check if the track already exists in the current state
        const existingTrack = topChart.find(t => t.spotifyId === trackFromSpotify.id);
    
        // Prepare the track data in the needed format
        const track = {
            spotifyId: trackFromSpotify.id,
            votes: existingTrack ? existingTrack.votes + 1 : 1, // Increment votes if exists, otherwise start with 1
            isNew: !existingTrack // isNew flag for conditional validation
        };
    
        // Include additional details if the track is new
        if (!existingTrack) {
            track.name = trackFromSpotify.name;
            track.artists = trackFromSpotify.artists.map(artist => artist.name);
            track.albumCoverUrl = trackFromSpotify.album.images[0].url;
        }
    
        try {
            // Validate the track data against the schema
            const validTrack = await trackSchema.validate(track);
    
            // Update local state and emit changes
            if (existingTrack) {
                const updatedTrack = { ...existingTrack, votes: validTrack.votes };
                setTopChart(prev => [...prev.filter(t => t.spotifyId !== track.spotifyId), updatedTrack]);
                socket.emit('updateTopChart', { roomId: roomData.id, track: { spotifyId: track.spotifyId, votes: updatedTrack.votes } });
            } else {
                setTopChart(prev => [...prev, validTrack]);
                socket.emit('updateTopChart', { roomId: roomData.id, track: validTrack });
            }
        } catch (error) {
            console.error('Validation error:', error);
        }
    };
    
    
    useEffect(() => {
        if (socket) {
            const handleTopChartUpdate = trackUpdate => {
                console.log('Handling topChart update for:', trackUpdate.spotifyId);
                setTopChart(prevTopChart => {
                    const trackIndex = prevTopChart.findIndex(t => t.spotifyId === trackUpdate.spotifyId);
    
                    if (trackIndex !== -1) {
                        if (trackUpdate.votes === 0) {
                            return prevTopChart.filter(t => t.spotifyId !== trackUpdate.spotifyId);
                        } else {
                            return prevTopChart.map((item, index) => 
                                index === trackIndex ? { ...item, votes: trackUpdate.votes } : item
                            );
                        }
                    } else if (trackUpdate.votes > 0) {
                        return [...prevTopChart, {
                            spotifyId: trackUpdate.spotifyId,
                            name: trackUpdate.name,
                            artists: trackUpdate.artists,
                            albumCoverUrl: trackUpdate.albumCoverUrl,
                            votes: trackUpdate.votes
                        }];
                    }
                    return prevTopChart;
                });
            };
    
            socket.on('topChartUpdated', handleTopChartUpdate);
            return () => socket.off('topChartUpdated', handleTopChartUpdate);
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
                                        <Image src={track.album.images.slice(-1)[0].url} alt="Album Cover" className={styles.albumImage} width={640} height={640} />
                                        <div className={styles.trackInfo}>
                                            <div className={styles.artistName}>{track.artists.map(artist => artist.name).join(', ')}</div>
                                            <div className={styles.trackName}>{track.name}</div>
                                        </div>
                                        {track.votes > 0 && (
                                            <div className={styles.voteCount}>{track.votes}</div>
                                        )}
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
                                    <Image src={track.albumCoverUrl} alt="Album Cover" className={styles.albumImage} width={640} height={640} />
                                    <div className={styles.trackInfo}>
                                        <div className={styles.artistName}>{track.artists.join(', ')}</div>
                                        <div className={styles.trackName}>{track.name}</div>
                                    </div>
                                    <div className={styles.voteCount}>
                                        {track.votes} {/* Display the vote count */}
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
