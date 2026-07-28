const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT conversations.id, conversations.last_message_at,
        contacts.id as contact_id, contacts.name, contacts.wa_id,
        contacts.status, contacts.phone,
        (SELECT content FROM messages WHERE messages.conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations
      JOIN contacts ON conversations.contact_id = contacts.id
      ORDER BY conversations.last_message_at DESC
    `);

    const conversations = result.rows.map(row => {
      if (!req.user.can_see_phone) {
        row.phone = null;
      }
      return row;
    });

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/:id/messages', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
