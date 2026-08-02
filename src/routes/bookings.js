const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth, requireAdmin } = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  const { contact_id, branch_id, service, guests, date, time, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO bookings (contact_id, branch_id, service, guests, date, time, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [contact_id, branch_id, service, guests, date, time, notes, 'Pending']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.get('/', auth, async (req, res) => {
  const { branch_id, date, status } = req.query;
  try {
    let query = `
      SELECT bookings.*, contacts.name as contact_name, contacts.phone, branches.name as branch_name
      FROM bookings
      JOIN contacts ON bookings.contact_id = contacts.id
      LEFT JOIN branches ON bookings.branch_id = branches.id
      WHERE 1=1
    `;
    const params = [];

    if (branch_id) { params.push(branch_id); query += ` AND bookings.branch_id = $${params.length}`; }
    if (date) { params.push(date); query += ` AND bookings.date = $${params.length}`; }
    if (status) { params.push(status); query += ` AND bookings.status = $${params.length}`; }

    query += ' ORDER BY bookings.date ASC, bookings.time ASC';

    const result = await pool.query(query, params);
    const bookings = result.rows.map(row => {
      if (!req.user.can_see_phone) row.phone = null;
      return row;
    });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  const { status, service, guests, date, time, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE bookings SET status = COALESCE($1, status), service = COALESCE($2, service), guests = COALESCE($3, guests), date = COALESCE($4, date), time = COALESCE($5, time), notes = COALESCE($6, notes) WHERE id = $7 RETURNING *',
      [status, service, guests, date, time, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

module.exports = router;
