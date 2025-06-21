require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const blocksRouter = require('./routes/codeblocks');

const app = express();

// Open CORS for everyone (just for testing)
app.use(cors());

// JSON body parsing
app.use(express.json());

// Mount your CodeBlocks API
app.use('/api/codeblocks', blocksRouter);

// Health check
app.get('/', (req, res) => res.send('OK'));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Start Express
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
