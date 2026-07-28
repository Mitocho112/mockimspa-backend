const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db');

const webhookRouter = require('./routes/webhook');
const messagesRouter = require('./routes/messages');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Moc Kim Spa API running'));
app.use('/webhook', webhookRouter);
app.use('/api/messages', messagesRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
