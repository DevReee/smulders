const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { readFile } = require('fs').promises;
const path = require('path');

const USERS_FILE = path.join(__dirname, '../data/storage/users.json');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const data = await readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);

        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(500).json({ message: 'Error during authentication' });
    }
});

module.exports = router;
