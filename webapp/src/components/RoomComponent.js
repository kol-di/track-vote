import React, { useState, useCallback, useRef, useEffect } from 'react';
import debounce from 'lodash/debounce';
import styles from './RoomComponent.module.css';
import Image from 'next/image';
import Marquee from "react-fast-marquee";
import SwipeableContainer from './SwipeableContainer';


const RoomComponent = ({ roomData, socket, isAdmin, latestVoteId }) => {
    const [searchActive, setSearchActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [topChart, setTopChart] = useState(roomData.tracks || []);
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);
    const resultSelectedRef = useRef(false);
    const [swipedTrackId, setSwipedTrackId] = useState(null);
    const [currentVoteId, setCurrentVoteId] = useState(latestVoteId);

    
    useEffect(() => {
        setCurrentVoteId(latestVoteId);
      }, [latestVoteId]);

    const updateTopChartState = (updates) => {
        setTopChart(prevTopChart => {
            let newTopChart = [...prevTopChart];
    
            updates.forEach(update => {
                const { track, increment } = update;
                const trackIndex = newTopChart.findIndex(t => t.spotifyId === track.spotifyId);
    
                if (trackIndex !== -1) {
                    // Track exists, update votes
                    const updatedVotes = newTopChart[trackIndex].votes + increment;
                    newTopChart[trackIndex] = { ...newTopChart[trackIndex], votes: updatedVotes };
    
                    // Remove track if votes drop to zero or below
                    if (updatedVotes <= 0) {
                        console.log("updateTopChart: updated votes <= 0");
                        newTopChart.splice(trackIndex, 1);
                        
                        setCurrentVoteId(currentVoteId => {
                            if (track.spotifyId === currentVoteId) {
                                return null;
                            }
                            return currentVoteId;
                        });

                    } else {
                        // Adjust position in sorted array (move up or down)
                        let moveIndex = trackIndex;
    
                        // Move up if votes increased
                        while (moveIndex > 0 && newTopChart[moveIndex - 1].votes < newTopChart[moveIndex].votes) {
                            [newTopChart[moveIndex], newTopChart[moveIndex - 1]] = [newTopChart[moveIndex - 1], newTopChart[moveIndex]];
                            moveIndex--;
                        }
    
                        // Move down if votes decreased
                        while (moveIndex < newTopChart.length - 1 && newTopChart[moveIndex + 1].votes > newTopChart[moveIndex].votes) {
                            [newTopChart[moveIndex], newTopChart[moveIndex + 1]] = [newTopChart[moveIndex + 1], newTopChart[moveIndex]];
                            moveIndex++;
                        }
                    }
                } else if (increment > 0) {
                    // New track, add to chart with initial votes
                    newTopChart.push({ ...track, votes: increment });
    
                    // Move new track to correct position
                    let moveIndex = newTopChart.length - 1;
                    while (moveIndex > 0 && newTopChart[moveIndex - 1].votes < newTopChart[moveIndex].votes) {
                        [newTopChart[moveIndex], newTopChart[moveIndex - 1]] = [newTopChart[moveIndex - 1], newTopChart[moveIndex]];
                        moveIndex--;
                    }
                }
            });
    
            // console.log("Top chart after update", JSON.stringify(newTopChart, null, 2));
            return newTopChart;
        });
    }
     


    const fetchSearchResults = async (query) => {
        setIsLoading(true);
        const response = await fetch(`/api/search?query=${query}`);
        if (response.ok && !resultSelectedRef.current) {
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

    const updateTopChartFromList = async (trackFromList) => {    
        console.log('trackFromList inside updateTopChart', trackFromList);
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
                spotifyId: trackFromList.spotifyId,
                telegramId
            })
        });
    
        if (response.ok) {
            const { decrementedTrackId, sameClick = false } = await response.json();

            if (sameClick) {
                return;
            }

            console.log('currentVoteId was', currentVoteId);
            setCurrentVoteId(trackFromList.spotifyId);
            console.log('currentVoteId is now', currentVoteId);

            const trackUpdates = [
                { track: { ...trackFromList }, increment: 1 }
            ];
            
            // Add the decremented track only if decrementedTrackId is not null
            if (decrementedTrackId) {
                trackUpdates.push({ track: { spotifyId: decrementedTrackId }, increment: -1 });
            }

            updateTopChartState(trackUpdates);
            
            socket.emit('updateTopChart', {
                roomId: roomData.id,
                tracks: trackUpdates
            });

        } else {
            console.error('Failed to update votes:', response.statusText);
        }
    };

    const updateTopChartFromSpotify = async (trackFromSpotify) => {
        resultSelectedRef.current = true;
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

            setCurrentVoteId(trackFromSpotify.id);

            const trackUpdates = [
                { track: {
                    spotifyId: trackFromSpotify.id,
                    name: trackFromSpotify.name,
                    artists: trackFromSpotify.artists.map(artist => artist.name),
                    albumCoverUrl: trackFromSpotify.album.images[0].url,
                }, increment: 1 }
            ];
            
            // Add the decremented track only if decrementedTrackId is not null
            if (decrementedTrackId) {
                trackUpdates.push({ track: { spotifyId: decrementedTrackId }, increment: -1 });
            }

            updateTopChartState(trackUpdates);
            
            socket.emit('updateTopChart', {
                roomId: roomData.id,
                tracks: trackUpdates
            });

        } else {
            console.error('Failed to update votes:', response.statusText);
        }
    };
    
    
    
    useEffect(() => {
        const handleTopChartUpdate = tracks => {
            console.log('Recieved topChartUpdated from websocket with tracks', tracks);
            updateTopChartState(tracks);
        };

        const handleLatestData = data => {
            console.log('Received latestData');
            setTopChart(data.tracks);
        };

        if (socket) {
            socket.on('topChartUpdated', handleTopChartUpdate);
            socket.on('latestData', handleLatestData);

            // Emmit a one-time full tracklist when component mounts
            if (socket.connected) {
                socket.emit('requestLatestData', { roomId: roomData.id });
            } else {
                socket.on('connect', () => {
                    socket.emit('requestLatestData', { roomId: roomData.id });
                });
            }

            return () => {
                socket.off('topChartUpdated', handleTopChartUpdate);
                socket.off('latestData', handleTopChartUpdate);
            }
        }
    }, [socket, roomData.id]);


    const deleteTrack = async (trackId) => {
        const response = await fetch(`/api/rooms/${roomData.id}/delete-track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: roomData.id, trackId })
        });
    
        if (response.ok) {
            const { decrementedTrackId, deletedTrackVoteCount } = await response.json();
    
            const trackUpdates = [
                { track: { spotifyId: decrementedTrackId }, increment: -deletedTrackVoteCount }
            ];
    
            console.log("Deleting track, local top chart updates:", trackUpdates);
            updateTopChartState(trackUpdates);

            setCurrentVoteId(currentVoteId => {
                if (decrementedTrackId === currentVoteId) {
                    return null;
                }
                return currentVoteId;
            });
    
            socket.emit('deleteTrack', {
                roomId: roomData.id,
                trackUpdates
            });
        } else {
            console.error('Failed to delete track:', response.statusText);
        }
    };

    const handleDeleteTrack = (trackId) => {
        if (confirm('Are you sure you want to delete this track?')) {
            deleteTrack(trackId);
        }
    };
    
    

    const handleSearchChange = (event) => {
        const query = event.target.value;
        resultSelectedRef.current = false;
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
                <Marquee>
                    <h1 className={styles.roomName}>{roomData.roomName}</h1>
                    <div className={styles.tab}></div>
                </Marquee>
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
                                    <li key={index} className={styles.trackItem} onClick={() => updateTopChartFromSpotify(track)}>
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
                                <SwipeableContainer 
                                    key={track.spotifyId}
                                    isAdmin={isAdmin}
                                    isSwiped={swipedTrackId === track.spotifyId}
                                    onSwipe={() => setSwipedTrackId(track.spotifyId)}
                                    onDelete={() => handleDeleteTrack(track.spotifyId)}
                                    onClose={() => setSwipedTrackId(null)}
                                >
                                    <li key={track.spotifyId} className={`${styles.trackItem} ${track.spotifyId === currentVoteId ? styles.votedTrack : ''}`} onClick={() => updateTopChartFromList(track)}>
                                        <div className={styles.innerContent}>
                                            <Image src={track.albumCoverUrl} alt="Album Cover" className={styles.albumImage} width={640} height={640} />
                                            <div className={styles.trackInfo}>
                                                <div className={styles.artistName}>{track.artists.join(', ')}</div>
                                                <div className={styles.trackName}>{track.name}</div>
                                            </div>
                                            <div className={styles.voteCount}>
                                                {track.votes} {/* Display the vote count */}
                                            </div>
                                            {/* <div>{isAdmin ? "admin" : "not admin"}</div> */}
                                            {/* {isAdmin && (
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteTrack(track.spotifyId); }}>Delete</button>
                                            )} */}
                                        </div>
                                    </li>
                                </SwipeableContainer>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomComponent;
