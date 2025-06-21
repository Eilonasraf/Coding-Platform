require('dotenv').config();
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
