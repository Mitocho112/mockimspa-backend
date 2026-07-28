const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth, requireAdmin } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM message_templates ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/', auth, requireAdmin, async (req, res) => {
  const { title, body } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO message_templates (title, body, created_by) VALUES ($1, $2, $3) RETURNING *',
      [title, body, req.user.user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM message_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;
