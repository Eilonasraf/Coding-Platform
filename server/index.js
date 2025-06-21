require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const blocksRouter = require('./routes/codeblocks');

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'https://client-production-7386.up.railway.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Mount CodeBlocks router
app.use('/api/codeblocks', blocksRouter);

// Health check
app.get('/', (req, res) => res.send('OK'));

// Create HTTP server
const server = http.createServer(app);

// Add Socket.IO
const io = new Server(server, {
  cors: corsOptions
});

// Socket.IO room management
const rooms = {};
const socketRooms = {}; // Track which room each socket is in

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);
  
  socket.on('join-room', roomId => {
    console.log(`Socket ${socket.id} joining room ${roomId}`);
    
    // Leave previous room if any
    const previousRoom = socketRooms[socket.id];
    if (previousRoom) {
      socket.leave(previousRoom);
      handleRoomLeave(socket, previousRoom);
    }
    
    // Join new room
    if (!rooms[roomId]) {
      rooms[roomId] = { mentor: null, students: new Set() };
    }
    
    const room = rooms[roomId];
    socket.join(roomId);
    socketRooms[socket.id] = roomId; // Track which room this socket is in

    // Assign role: first person is mentor, others are students
    if (!room.mentor) {
      room.mentor = socket.id;
      socket.emit('role', 'mentor');
      console.log(`${socket.id} assigned as mentor in room ${roomId}`);
    } else {
      room.students.add(socket.id);
      socket.emit('role', 'student');
      console.log(`${socket.id} assigned as student in room ${roomId}`);
    }

    // Send student count to all in room
    io.to(roomId).emit('student-count', room.students.size);
  });

  // Handle code changes
  socket.on('code-change', code => {
    const currentRoom = socketRooms[socket.id];
    if (currentRoom) {
      socket.to(currentRoom).emit('code-update', code);
    }
  });

  // Handle explicit leave-room (when user clicks Leave button)
  socket.on('leave-room', roomId => {
    console.log(`Socket ${socket.id} explicitly leaving room ${roomId}`);
    handleRoomLeave(socket, roomId);
    socket.leave(roomId);
    delete socketRooms[socket.id];
  });
  
  // Handle disconnect (moved to top level)
  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
    const currentRoom = socketRooms[socket.id];
    if (currentRoom) {
      handleRoomLeave(socket, currentRoom);
      delete socketRooms[socket.id];
    }
  });
  
  // Helper function to handle room leaving
  function handleRoomLeave(socket, roomId) {
    const room = rooms[roomId];
    if (!room) return;
    
    if (room.mentor === socket.id) {
      // Mentor is leaving - notify all students and clean up room
      console.log(`Mentor ${socket.id} leaving room ${roomId} - notifying students`);
      socket.to(roomId).emit('mentor-left');
      delete rooms[roomId];
      console.log(`Room ${roomId} deleted`);
    } else if (room.students.has(socket.id)) {
      // Student is leaving
      room.students.delete(socket.id);
      io.to(roomId).emit('student-count', room.students.size);
      console.log(`Student ${socket.id} left room ${roomId}`);
    }
  }
});

// Listen on Railway's port
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
