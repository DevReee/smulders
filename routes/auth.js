const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const { findUser, readFile } = require('../data/db');

const USERS_FILE = path.join(__dirname, '../data/storage/users.json');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        // Try to read users from the file
        let users = [];
        try {
            users = await readFile(USERS_FILE);
            if (!Array.isArray(users)) {
                throw new Error('Invalid users data format');
            }
        } catch (err) {
            console.error('Error reading users file:', err);
            // If there's an error, create a default admin user
            users = [{
                id: "1",
                username: "admin",
                password: "admin",
                role: "admin"
            }];
            // Write the default user to the file
            const fs = require('fs').promises;
            await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        }

        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username,
                role: user.role || 'user'
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during authentication' });
    }
});

module.exports = router;
