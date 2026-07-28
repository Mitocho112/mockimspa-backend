const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM contacts ORDER BY created_at DESC';
    let params = [];

    if (search) {
      query = 'SELECT * FROM contacts WHERE name ILIKE $1 OR phone ILIKE $1 ORDER BY created_at DESC';
      params = [`%${search}%`];
    }

    const result = await pool.query(query, params);
    const contacts = result.rows.map(row => {
      if (!req.user.can_see_phone) row.phone = null;
      return row;
    });

    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const contact = await pool.query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);
    if (contact.rows.length === 0) return res.status(404).json({ error: 'Contact not found' });

    const bookings = await pool.query('SELECT * FROM bookings WHERE contact_id = $1 ORDER BY created_at DESC', [req.params.id]);
    const labels = await pool.query('SELECT label FROM contact_labels WHERE contact_id = $1', [req.params.id]);

    const contactData = contact.rows[0];
    if (!req.user.can_see_phone) contactData.phone = null;

    res.json({ ...contactData, bookings: bookings.rows, labels: labels.rows.map(l => l.label) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  const { name, status, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE contacts SET name = COALESCE($1, name), status = COALESCE($2, status), notes = COALESCE($3, notes) WHERE id = $4 RETURNING *',
      [name, status, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

module.exports = router;
