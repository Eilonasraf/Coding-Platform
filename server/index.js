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

// Mount your CodeBlocks router
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

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);
  
  socket.on('join-room', roomId => {
    console.log(`Socket ${socket.id} joining room ${roomId}`);
    
    if (!rooms[roomId]) {
      rooms[roomId] = { mentor: null, students: new Set() };
    }
    
    const room = rooms[roomId];
    socket.join(roomId);

    // Assign role: first person is mentor, others are students
    if (!room.mentor) {
      room.mentor = socket.id;
      socket.emit('role', 'mentor');
      console.log(`${socket.id} assigned as mentor`);
    } else {
      room.students.add(socket.id);
      socket.emit('role', 'student');
      console.log(`${socket.id} assigned as student`);
    }

    // Send student count to all in room
    io.to(roomId).emit('student-count', room.students.size);

    // Handle code changes
    socket.on('code-change', code => {
      socket.to(roomId).emit('code-update', code);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      const r = rooms[roomId];
      if (!r) return;
      
      if (socket.id === r.mentor) {
        // Mentor left - notify students and clean up room
        io.to(roomId).emit('mentor-left');
        // Force everyone to leave the room
        io.in(roomId).socketsLeave(roomId);
        // Clean up server‐side state
        delete rooms[roomId];
        console.log(`Mentor ${socket.id} left, room ${roomId} deleted`);
      } else {
        // Student left
        r.students.delete(socket.id);
        io.to(roomId).emit('student-count', r.students.size);
        console.log(`Student ${socket.id} left room ${roomId}`);
      }
    });
  });
});

// Listen on Railway's port
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
