require('dotenv').config();

const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const blocksRouter = require('./routes/codeblocks');

const app = express();

// —— Allow all origins for both REST and WebSocket ——
// (In production you can lock this down to your client URL,
// but let's get it working first.)
app.use(cors());
app.use(express.json());
app.use('/api/codeblocks', blocksRouter);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const server = http.createServer(app);

// Socket.IO with open CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS']
  }
});

const rooms = {};  // { [roomId]: { mentor: socketId|null, students: Set<socketId> } }

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

  socket.on('join-room', roomId => {
    if (!rooms[roomId]) rooms[roomId] = { mentor: null, students: new Set() };
    const room = rooms[roomId];

    socket.join(roomId);
    if (!room.mentor) {
      room.mentor = socket.id;
      socket.emit('role', 'mentor');
    } else {
      room.students.add(socket.id);
      socket.emit('role', 'student');
    }
    io.to(roomId).emit('student-count', room.students.size);

    socket.on('code-change', code => socket.to(roomId).emit('code-update', code));
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

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
