require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const blocksRouter = require('./routes/codeblocks');

const app = express();

// CORS: allow requests from your deployed client
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true
}));

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

// Listen on Railway’s port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
