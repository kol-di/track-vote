const RoomComponent = ({ roomData }) => {
    return (
        <div>
            <h1>Room: {roomData.roomName}</h1>
            <h2>Admins:</h2>
            <ul>
                {roomData.admins.map((admin, index) => (
                    // Assuming admin is an object with fields such as telegramId
                    <li key={index}>{admin}</li>
                ))}
            </ul>
            <input type="text" placeholder="Search tracks..." /> {/* Future implementation for search */}
            <div>
                <h3>Tracks</h3>
                <ul>
                    {roomData.tracks.map((track, index) => (
                        <li key={index}>
                            Spotify ID: {track.spotifyId} - Votes: {track.votes}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default RoomComponent;
