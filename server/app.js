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

  const directorId = isEvenRound ? player2 : player1;
  const guesserId = isEvenRound ? player1 : player2;

  io.to(directorId).emit('role_assigned', { role: 'director' });
  io.to(guesserId).emit('role_assigned', { role: 'guesser' });
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


// === public/game.client.js ===
const socket = io();

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('id') || 'default';
socket.emit('join_room', roomId);

let userRole = null;

socket.on('role_assigned', ({ role }) => {
  userRole = role;
  document.getElementById('role-ui').innerText = `You are the ${role}`;
  document.getElementById('director-ui').style.display = role === 'director' ? 'block' : 'none';
});

function selectTarget(objectId) {
  socket.emit('select_target', { roomId, objectId });
}

const clickableObjects = document.querySelectorAll('.clickable');
clickableObjects.forEach(obj => {
  obj.addEventListener('click', () => {
    if (userRole === 'guesser') {
      socket.emit('object_selected', { roomId, objectId: obj.id });
    }
  });
});

socket.on('object_selected', ({ objectId }) => {
  const obj = document.getElementById(objectId);
  if (obj) obj.setAttribute('animation', 'property: scale; to: 1.5 1.5 1.5; dur: 500; dir: alternate; loop: 2');
});

socket.on('target_selected', ({ objectId }) => {
  const obj = document.getElementById(objectId);
  if (obj) obj.setAttribute('material', 'color: green');
});

socket.on('feedback', ({ objectId, correct }) => {
  const feedbackDiv = document.getElementById('feedback');
  feedbackDiv.innerText = correct ? '✅ Correct!' : '❌ Wrong object';
  feedbackDiv.style.display = 'block';
  setTimeout(() => { feedbackDiv.style.display = 'none'; }, 2000);
});

socket.on('round_info', ({ round, scores }) => {
  const scoreText = Object.entries(scores).map(([id, score]) => `${id.slice(-4)}: ${score}`).join(' | ');
  document.getElementById('round-ui').innerText = `Round ${round} — Scores: ${scoreText}`;
});

socket.on('game_over', ({ scores }) => {
  alert('Game Over! Final Scores:\n' + JSON.stringify(scores, null, 2));
});

