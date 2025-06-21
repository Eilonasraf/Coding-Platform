// server/index.js
require('dotenv').config();
const express = require('express');
const blocksRouter = require('./routes/codeblocks');

const app = express();
app.use(express.json());
app.use('/api/codeblocks', blocksRouter);

// A simple health check
app.get('/', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
