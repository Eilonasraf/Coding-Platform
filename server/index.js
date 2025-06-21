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

// — REST API CORS & JSON parsing —
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// — Mount CodeBlock routes —
app.use('/api/codeblocks', blocksRouter);

// — Health-check endpoint —
app.get('/', (req, res) => res.send('OK'));

// — MongoDB connection —
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// — Create HTTP server & attach Socket.IO —
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

const rooms = {}; 
// { [roomId]: { mentor: socket.id|null, students: Set<socket.id> } }

io.on('connection', socket => {
  console.log('🟢 Socket connected:', socket.id);

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

    // on code-change from any client, relay to the others
    socket.on('code-change', code => socket.to(roomId).emit('code-update', code));

    // handle leave-room
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

    // fallback on disconnect
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

// — Start listening on the Railway port (typically 8080) —
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
