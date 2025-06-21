// server/index.js

require('dotenv').config();

const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const blocksRouter = require('./routes/codeblocks');

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN; 
// should be "https://client-production-7386.up.railway.app"

const corsOptions = {
  origin: CLIENT_ORIGIN,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
};

const app = express();

// Enable CORS for REST API
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// JSON body parsing
app.use(express.json());

// Mount the CodeBlocks router
app.use('/api/codeblocks', blocksRouter);

// Health check endpoint
app.get('/', (req, res) => res.send('OK'));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create an HTTP server, then attach Socket.IO to it
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

const rooms = {}; // { [roomId]: { mentor: socket.id|null, students: Set<socket.id> } }

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

  socket.on('join-room', roomId => {
    if (!rooms[roomId]) rooms[roomId] = { mentor: null, students: new Set() };
    const room = rooms[roomId];

    socket.join(roomId);

    // Assign mentor or student
    if (!room.mentor) {
      room.mentor = socket.id;
      socket.emit('role', 'mentor');
    } else {
      room.students.add(socket.id);
      socket.emit('role', 'student');
    }

    // Broadcast the current student count
    io.to(roomId).emit('student-count', room.students.size);

    // Relay code changes to other clients
    socket.on('code-change', code => {
      socket.to(roomId).emit('code-update', code);
    });

    // Handle a user leaving the room
    socket.on('leave-room', id => {
      const r = rooms[id];
      if (!r) return;

      if (socket.id === r.mentor) {
        socket.to(id).emit('mentor-left');
        delete rooms[id];
      } else {
        r.students.delete(socket.id);
        socket.leave(id);
        io.to(id).emit('student-count', r.students.size);
      }
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      const r = rooms[roomId];
      if (!r) return;

      if (socket.id === r.mentor) {
        socket.to(roomId).emit('mentor-left');
        delete rooms[roomId];
      } else {
        r.students.delete(socket.id);
        io.to(roomId).emit('student-count', r.students.size);
      }
    });
  });
});

// Start listening on Railway’s port (defaults to 8080 in production)
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
