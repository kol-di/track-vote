const EventEmitter = require('events');

class MockSocket extends EventEmitter {
    emit(event, ...args) {
        super.emit(event, ...args); // Use super to call the EventEmitter's emit method
    }
    close() {
        this.emit('disconnect');
    }
    simulateConnect() {
        this.emit('connect');
    }
    simulateConnectError(error) {
        this.emit('connect_error', error);
    }
}

const io = jest.fn(() => {
    const socket = new MockSocket();
    setTimeout(() => socket.simulateConnect(), 0); // Simulate async connect
    jest.spyOn(socket, 'emit');
    return socket;
});

module.exports = io;
