// server/index.js

require('dotenv').config();
const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const blocksRouter = require('./routes/codeblocks');

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
// e.g. "https://client-production-7386.up.railway.app"

const corsOptions = {
  origin: CLIENT_ORIGIN,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
};

const app = express();
// REST API CORS & JSON
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// CodeBlocks routes
app.use('/api/codeblocks', blocksRouter);

// Health check
app.get('/', (req, res) => res.send('OK'));

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

// In-memory room state
const rooms = {}; // { [roomId]: { mentor: socket.id|null, students: Set<socket.id> } }

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

  socket.on('join-room', roomId => {
    if (!rooms[roomId]) rooms[roomId] = { mentor: null, students: new Set() };
    const room = rooms[roomId];
    socket.join(roomId);

    // assign role
    if (!room.mentor) {
      room.mentor = socket.id;
      socket.emit('role', 'mentor');
    } else {
      room.students.add(socket.id);
      socket.emit('role', 'student');
    }

    // broadcast student count
    io.to(roomId).emit('student-count', room.students.size);

    // relay code changes
    socket.on('code-change', code => socket.to(roomId).emit('code-update', code));

    // explicit leave
    socket.on('leave-room', id => {
      const r = rooms[id];
      if (!r) return;

      if (socket.id === r.mentor) {
        // Mentor leaving: kick everyone
        io.to(id).emit('mentor-left');
        io.in(id).socketsLeave(id);
        delete rooms[id];
      } else {
        // Student leaving
        r.students.delete(socket.id);
        socket.leave(id);
        io.to(id).emit('student-count', r.students.size);
      }
    });

    // handle disconnect same as leave
    socket.on('disconnect', () => {
      const r = rooms[roomId];
      if (!r) return;

      if (socket.id === r.mentor) {
        io.to(roomId).emit('mentor-left');
        io.in(roomId).socketsLeave(roomId);
        delete rooms[roomId];
      } else {
        r.students.delete(socket.id);
        io.to(roomId).emit('student-count', r.students.size);
      }
    });
  });
});

// listen on Railway port (8080)
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
