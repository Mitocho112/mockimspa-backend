const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/', async (req, res) => {
  res.sendStatus(200);
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    if (!messages || messages.length === 0) return;
    const msg = messages[0];
    const wa_id = msg.from;
    const content = msg.text?.body || '[non-text message]';
    const wa_message_id = msg.id;
    const timestamp = new Date(parseInt(msg.timestamp) * 1000);
    let contact = await pool.query('SELECT * FROM contacts WHERE wa_id = $1', [wa_id]);
    if (contact.rows.length === 0) {
      contact = await pool.query('INSERT INTO contacts (wa_id, name, status) VALUES ($1, $2, $3) RETURNING *', [wa_id, wa_id, 'Lead']);
    }
    const contact_id = contact.rows[0].id;
    let conversation = await pool.query('SELECT * FROM conversations WHERE contact_id = $1', [contact_id]);
    if (conversation.rows.length === 0) {
      conversation = await pool.query('INSERT INTO conversations (contact_id, last_message_at) VALUES ($1, $2) RETURNING *', [contact_id, timestamp]);
    } else {
      await pool.query('UPDATE conversations SET last_message_at = $1 WHERE contact_id = $2', [timestamp, contact_id]);
    }
    const conversation_id = conversation.rows[0].id;
    await pool.query('INSERT INTO messages (conversation_id, direction, content, wa_message_id, created_at) VALUES ($1, $2, $3, $4, $5)', [conversation_id, 'inbound', content, wa_message_id, timestamp]);
    console.log('New message from ' + wa_id + ': ' + content);
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

module.exports = router;
