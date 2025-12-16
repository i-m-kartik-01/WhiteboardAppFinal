const http = require('http');
const { Server } = require('socket.io');

// Create an HTTP server
const server = http.createServer();

// Attach Socket.IO to the server
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start the server on port 3000
server.listen(5000, () => console.log('WebSocket server running on port 5000'));
