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
        setSearchResults([]);
    
        console.log('trackFromSpotify inside updateTopChart', trackFromSpotify);
        // Retrieve the Telegram ID via the Web Apps API
        const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const telegramId = telegramUser?.id;
    
        if (!telegramId) {
            console.error('Unable to retrieve Telegram ID from the WebApp API.');
            return;
        }
    
        // Prepare the vote request to `/api/vote`
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: roomData.id,
                spotifyId: trackFromSpotify.id,
                telegramId
            })
        });
    
        if (response.ok) {
            const { decrementedTrackId, sameClick = false } = await response.json();

            if (sameClick) {
                return;
            }
    
            // Update the top chart locally
            setTopChart(prevTopChart => {
                // Update the decremented track if it exists
                let newTopChart = prevTopChart.map(t => {
                    if (t.spotifyId === decrementedTrackId) {
                        const newVotes = t.votes - 1;
                        return { ...t, votes: newVotes > 0 ? newVotes : 0 };
                    }
                    return t;
                }).filter(t => t.votes > 0); // Remove only if the votes reach zero
    
                // Find the existing track or add a new one with the full information
                const existingTrack = newTopChart.find(t => t.spotifyId === trackFromSpotify.id);
    
                const updatedTrack = {
                    spotifyId: trackFromSpotify.id,
                    name: trackFromSpotify.name,
                    artists: trackFromSpotify.artists.map(artist => artist.name),
                    albumCoverUrl: trackFromSpotify.album.images[0].url,
                    votes: existingTrack ? existingTrack.votes + 1 : 1 // Increment or start from 1
                };
    
                // Add or update the incremented track
                newTopChart = [
                    ...newTopChart.filter(t => t.spotifyId !== updatedTrack.spotifyId),
                    updatedTrack
                ];
    
                return newTopChart;
            });
    
            // Emit to the WebSocket server the IDs of the incremented and decremented tracks
            const tracksToEmit = [
                { track: {
                    spotifyId: trackFromSpotify.id,
                    name: trackFromSpotify.name,
                    artists: trackFromSpotify.artists.map(artist => artist.name),
                    albumCoverUrl: trackFromSpotify.album.images[0].url,
                }, incremented: true }
            ];
            
            // Add the decremented track only if decrementedTrackId is not null
            if (decrementedTrackId) {
                tracksToEmit.push({ track: { spotifyId: decrementedTrackId }, incremented: false });
            }
            
            socket.emit('updateTopChart', {
                roomId: roomData.id,
                tracks: tracksToEmit
            });

        } else {
            console.error('Failed to update votes:', response.statusText);
        }
    };
    
    
    
    useEffect(() => {
        if (socket) {
            const handleTopChartUpdate = tracks => {
                setTopChart(prevTopChart => {
                    // Create a copy of the current top chart
                    let newTopChart = [...prevTopChart];
    
                    for (const trackInfo of tracks) {
                        const { track, incremented } = trackInfo;
    
                        // Find the index of the track in the current chart
                        const trackIndex = newTopChart.findIndex(t => t.spotifyId === track.spotifyId);
    
                        if (incremented) {
                            if (trackIndex !== -1) {
                                // Increment the existing track's vote count by 1
                                newTopChart[trackIndex] = {
                                    ...newTopChart[trackIndex],
                                    votes: newTopChart[trackIndex].votes + 1
                                };
                            } else {
                                // Add a new track with the full information and 1 vote
                                newTopChart.push({
                                    ...track, 
                                    votes: 1
                                });
                            }
                        } else {
                            if (trackIndex !== -1) {
                                // Decrement the existing track's vote count by 1
                                const decrementedTrack = {
                                    ...newTopChart[trackIndex],
                                    votes: newTopChart[trackIndex].votes - 1
                                };
    
                                if (decrementedTrack.votes === 0) {
                                    // Remove the track from the top chart if votes drop to 0
                                    newTopChart = newTopChart.filter(t => t.spotifyId !== track.spotifyId);
                                } else {
                                    // Update the track with the decremented votes
                                    newTopChart[trackIndex] = decrementedTrack;
                                }
                            }
                        }
                    }
    
                    return newTopChart;
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
