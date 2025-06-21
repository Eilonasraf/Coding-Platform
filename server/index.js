require('dotenv').config();

const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const blocksRouter = require('./routes/codeblocks');

// CORS options for your deployed client
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
};

const app = express();
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use('/api/codeblocks', blocksRouter);

// Health check
app.get('/', (req, res) => res.send('OK'));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

const rooms = {}; // { [roomId]: { mentor: socketId|null, students: Set<socketId> } }

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

    // broadcast updated count
    io.to(roomId).emit('student-count', room.students.size);

    // relay code changes
    socket.on('code-change', code => socket.to(roomId).emit('code-update', code));

    // handle leaving
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

// Listen on Railway’s port
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
