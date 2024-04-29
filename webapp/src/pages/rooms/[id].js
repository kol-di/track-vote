import RoomComponent from '../../components/RoomComponent';

export async function getServerSideProps(context) {
    console.log('FETCHING THE PAGE');
    const { id } = context.params;
    const baseUrl = process.env.NEXT_PUBLIC_WEB_APP_BASE_URL;
    try {
        const res = await fetch(`${baseUrl}/api/rooms/${id}`); // Adjust the URL if necessary
        if (!res.ok) {
            throw new Error('Failed to fetch');
        }
        const data = await res.json();
        console.log('FETCH SUCCESS');
        return { props: { roomData: data } };
    } catch (error) {
        // Handle errors, possibly return an error page or notFound: true
        return { props: { roomData: null } };
    }
}

const RoomPage = ({ roomData }) => {
    console.log('BOUT TO RENDER');
    if (!roomData) return <p>Room not found.</p>;
    return <RoomComponent roomData={roomData} />;
}

export default RoomPage;
