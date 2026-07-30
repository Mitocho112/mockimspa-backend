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
      'INSERT INTO users (name, email, password_hash, role, can_see_phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, can_see_phone, created_at',
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
      'UPDATE users SET role = COALESCE($1, role), can_see_phone = COALESCE($2, can_see_phone) WHERE id = $3 RETURNING id, name, email, role, can_see_phone, created_at',
      [role, can_see_phone, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;