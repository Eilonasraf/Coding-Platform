require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'https://client-production-7386.up.railway.app';
const corsOptions = {
  origin: CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));
// Only use '*' for preflight, never a URL!
app.options('*', cors(corsOptions));

app.get('/', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
