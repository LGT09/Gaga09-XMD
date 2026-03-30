// pair.js
const express = require('express');
const router = express.Router();
const { EmpirePair } = require('./gaga');
const { makeid } = require('./id');

// Store pairing sessions in memory
const sessions = {};

/**
 * POST /code/pair
 * Body: { number: "263716857999" }
 * Returns: { sessionId: "abc123", code: "123-456" }
 */
router.post('/pair', async (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number required' });

    const cleanNumber = number.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 10) return res.status(400).json({ error: 'Invalid phone number' });

    const sessionId = makeid(8);
    sessions[sessionId] = { number: cleanNumber, code: null, status: 'pending', createdAt: Date.now() };

    // Create a mock response object to capture the pairing code
    const mockRes = {
        headersSent: false,
        send: (data) => {
            if (data && data.code) {
                sessions[sessionId].code = data.code;
                sessions[sessionId].status = 'success';
            } else {
                sessions[sessionId].status = 'error';
            }
        },
        status: () => mockRes,
        json: (data) => {
            if (data && data.code) {
                sessions[sessionId].code = data.code;
                sessions[sessionId].status = 'success';
            } else if (data && data.error) {
                sessions[sessionId].status = 'error';
                sessions[sessionId].error = data.error;
            }
        }
    };

    try {
        await EmpirePair(cleanNumber, mockRes);

        // Wait up to 15 seconds for the code to appear
        let retries = 0;
        while (retries < 30 && sessions[sessionId].code === null && sessions[sessionId].status !== 'error') {
            await new Promise(r => setTimeout(r, 500));
            retries++;
        }

        if (sessions[sessionId].code) {
            res.json({ sessionId, code: sessions[sessionId].code });
        } else if (sessions[sessionId].error) {
            res.status(500).json({ error: sessions[sessionId].error });
        } else {
            res.status(500).json({ error: 'Failed to obtain pairing code. Please try again.' });
        }
    } catch (err) {
        console.error('Pairing error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /code/status/:sessionId
 * Returns the current pairing status and code if available
 */
router.get('/status/:sessionId', (req, res) => {
    const session = sessions[req.params.sessionId];
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    // Clean up old sessions (older than 5 minutes)
    const now = Date.now();
    for (const [id, sess] of Object.entries(sessions)) {
        if (now - sess.createdAt > 300000) {
            delete sessions[id];
        }
    }
    
    res.json({ status: session.status, code: session.code });
});

module.exports = router;