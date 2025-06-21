require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ONLY CORS, no routers or sockets yet
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.get('/', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
