require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const blocksRouter = require('./routes/codeblocks');

const app = express();

// Debug logging
console.log('CLIENT_ORIGIN:', process.env.CLIENT_ORIGIN);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

// CORS configuration - allow all origins for now
const corsOptions = {
  origin: true, // This allows any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.get('Origin') || 'unknown origin'}`);
  next();
});

app.use('/api/codeblocks', blocksRouter);

// Health check
app.get('/', (req, res) => res.send('Server OK'));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const server = http.createServer(app);

// Socket.IO with permissive CORS
const io = new Server(server, {
  cors: {
    origin: true, // Allow any origin
    methods: ['GET', 'POST']
  }
});

const rooms = {};

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
