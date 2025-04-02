// === server/app.js ===
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 8000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

const roomData = {};

// Socket connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);

    if (!roomData[roomId]) roomData[roomId] = { clients: [], target: null };

    const role = roomData[roomId].clients.length === 0 ? 'director' : 'guesser';
    roomData[roomId].clients.push({ id: socket.id, role });

    socket.emit('role_assigned', { role });
  });

  socket.on('select_target', ({ roomId, objectId }) => {
    roomData[roomId].target = objectId;
    socket.to(roomId).emit('target_selected', { objectId });
  });

  socket.on('object_selected', ({ roomId, objectId }) => {
    const correct = roomData[roomId]?.target === objectId;
    io.to(roomId).emit('feedback', { objectId, correct });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const roomId in roomData) {
      roomData[roomId].clients = roomData[roomId].clients.filter(c => c.id !== socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
