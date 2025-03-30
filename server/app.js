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

// Socket connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  });

  socket.on('object_selected', ({ roomId, objectId }) => {
    socket.to(roomId).emit('object_selected', { objectId });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

