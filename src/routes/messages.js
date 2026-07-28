const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

router.post('/send', async (req, res) => {
  const { conversation_id, message_body } = req.body;

  try {
    const convResult = await pool.query(
      'SELECT contacts.wa_id FROM conversations JOIN contacts ON conversations.contact_id = contacts.id WHERE conversations.id = $1',
      [conversation_id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const wa_id = convResult.rows[0].wa_id;

    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: wa_id,
        type: 'text',
        text: { body: message_body }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const saved = await pool.query(
      'INSERT INTO messages (conversation_id, direction, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [conversation_id, 'outbound', message_body]
    );

    await pool.query(
      'UPDATE conversations SET last_message_at = NOW() WHERE id = $1',
      [conversation_id]
    );

    res.json({ success: true, message: saved.rows[0] });

  } catch (err) {
    console.error('Send message error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
