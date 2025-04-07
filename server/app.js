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

    if (!roomData[roomId]) {
      roomData[roomId] = {
        clients: [],
        target: null,
        round: 1,
        scores: {},
        maxRounds: 5
      };
    }

    const room = roomData[roomId];
    room.clients.push(socket.id);
    room.scores[socket.id] = 0;

    if (room.clients.length === 2) {
      assignRoles(roomId);
      io.to(roomId).emit('round_info', {
        round: room.round,
        scores: room.scores
      });
    }
  });

  socket.on('select_target', ({ roomId, objectId }) => {
    roomData[roomId].target = objectId;
    socket.to(roomId).emit('target_selected', { objectId });
  });

  socket.on('object_selected', ({ roomId, objectId }) => {
    const room = roomData[roomId];
    const correct = room?.target === objectId;
    if (correct) {
      room.scores[socket.id] += 1;
    }
    io.to(roomId).emit('feedback', { objectId, correct });

    // Advance to next round
    room.round += 1;
    if (room.round > room.maxRounds) {
      io.to(roomId).emit('game_over', { scores: room.scores });
      delete roomData[roomId];
    } else {
      assignRoles(roomId);
      io.to(roomId).emit('round_info', {
        round: room.round,
        scores: room.scores
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const roomId in roomData) {
      const room = roomData[roomId];
      room.clients = room.clients.filter(id => id !== socket.id);
      delete room.scores[socket.id];
    }
  });
});

function assignRoles(roomId) {
  const room = roomData[roomId];
  if (!room || room.clients.length < 2) return;

  const [player1, player2] = room.clients;
  const isEvenRound = room.round % 2 === 0;

  const directorId = isEven
