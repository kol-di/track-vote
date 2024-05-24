/**
 * @jest-environment <rootDir>/jest.environment.js
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoomPage, { getServerSideProps } from '../../pages/rooms/[id]';

jest.mock('socket.io-client');

global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '123', tracks: [{ votes: 1 }, { votes: 2 }], admins: [] }),
    })
);

describe('RoomPage getServerSideProps', () => {
    it('fetches room data and sorts tracks by votes', async () => {
        const context = { params: { id: '123' } };
        const { props } = await getServerSideProps(context);
        expect(props.roomData).toEqual({
            id: '123',
            tracks: [{ votes: 2 }, { votes: 1 }],
            admins: [],
        });
    });

    it('returns null roomData if fetch fails', async () => {
        global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: false }));
        const context = { params: { id: '123' } };
        const { props } = await getServerSideProps(context);
        expect(props.roomData).toBeNull();
    });
});

describe('RoomPage Component', () => {
    let io;

    beforeEach(() => {
        io = require('socket.io-client');
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders RoomComponent with correct props', async () => {
        const roomData = { id: '123', tracks: [], admins: ['admin1'] };
        render(<RoomPage roomData={roomData} socketClient={io} />);

        await waitFor(() => {
            expect(screen.queryByText('Room not found.')).not.toBeInTheDocument();
        });
    });

    it('shows "Room not found" when roomData is null', () => {
        render(<RoomPage roomData={null} />);
        expect(screen.getByText('Room not found.')).toBeInTheDocument();
    });

    it('initializes WebSocket connection and emits joinRoom', async () => {
        const roomData = { id: '123', tracks: [], admins: [] };
        render(<RoomPage roomData={roomData} socketClient={io} />);

        const mockSocketInstance = io.mock.results[0].value;

        await waitFor(() => {
            expect(mockSocketInstance.emit).toHaveBeenCalledWith('joinRoom', '123');
        });
    });

    it('handles WebSocket connect and disconnect events', async () => {
        const roomData = { id: '123', tracks: [], admins: [] };
        const { unmount } = render(<RoomPage roomData={roomData} socketClient={io} />);

        const mockSocketInstance = io.mock.results[0].value;

        await waitFor(() => {
            expect(mockSocketInstance.emit).toHaveBeenCalledWith('joinRoom', '123');
        });

        unmount();

        await waitFor(() => {
            expect(mockSocketInstance.emit).toHaveBeenCalledWith('disconnect');
        });
    });

    it('handles WebSocket connection error', async () => {
        const roomData = { id: '123', tracks: [], admins: [] };
        render(<RoomPage roomData={roomData} socketClient={io} />);

        const mockSocketInstance = io.mock.results[0].value;
        mockSocketInstance.simulateConnectError(new Error('Mock connection error'));

        await waitFor(() => {
            expect(mockSocketInstance.emit).toHaveBeenCalledWith('connect_error', new Error('Mock connection error'));
        });
    });
});
