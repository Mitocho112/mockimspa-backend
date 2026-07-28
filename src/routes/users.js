const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { auth, requireAdmin } = require('../middleware/auth');

router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, can_see_phone, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/', auth, requireAdmin, async (req, res) => {
  const { name, email, password, role, can_see_phone } = req.body;
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, can_see_phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, can_see_phone',
      [name, email, password_hash, role || 'sales', can_see_phone ?? true]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/:id', auth, requireAdmin, async (req, res) => {
  const { role, can_see_phone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET role = COALESCE($1,
cat > src/server.js << 'EOF'
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
app.use('/api/auth', authRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/users', usersRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
