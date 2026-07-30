const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db');

const webhookRouter = require('./routes/webhook');
const messagesRouter = require('./routes/messages');
const authRouter = require('./routes/auth');
const conversationsRouter = require('./routes/conversations');
const contactsRouter = require('./routes/contacts');
const bookingsRouter = require('./routes/bookings');
const templatesRouter = require('./routes/templates');
const usersRouter = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Moc Kim Spa API running'));
app.use('/webhook', webhookRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/users', usersRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
