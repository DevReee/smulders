const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const { readFile, writeFile } = require('../data/db');

const LICENSES_FILE = path.join(__dirname, '../data/storage/licenses.json');

// Auth middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get all licenses
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Check if file exists and create it with empty array if not
        try {
            await fs.access(LICENSES_FILE);
        } catch (err) {
            await fs.writeFile(LICENSES_FILE, JSON.stringify([], null, 2));
        }
        
        const data = await readFile(LICENSES_FILE);
        res.json(data);
    } catch (error) {
        console.error('Error fetching licenses:', error);
        res.status(500).json({ message: 'Error fetching licenses' });
    }
});

// Add new license
router.post('/', authMiddleware, async (req, res) => {
    try {
        const licenses = await readFile(LICENSES_FILE);
        
        const newLicense = {
            id: String(Date.now()),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        licenses.push(newLicense);
        await writeFile(LICENSES_FILE, licenses);
        
        res.status(201).json(newLicense);
    } catch (error) {
        console.error('Error creating license:', error);
        res.status(500).json({ message: 'Error creating license' });
    }
});

// Update license
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const licenses = await readFile(LICENSES_FILE);
        const index = licenses.findIndex(license => license.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ message: 'License not found' });
        }
        
        const originalLicense = licenses[index];
        licenses[index] = {
            ...originalLicense,
            ...req.body,
            id: originalLicense.id,
            updatedAt: new Date().toISOString()
        };
        
        await writeFile(LICENSES_FILE, licenses);
        res.json(licenses[index]);
    } catch (error) {
        console.error('Error updating license:', error);
        res.status(500).json({ message: 'Error updating license' });
    }
});

// Delete license
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const licenses = await readFile(LICENSES_FILE);
        const index = licenses.findIndex(license => license.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ message: 'License not found' });
        }
        
        licenses.splice(index, 1);
        await writeFile(LICENSES_FILE, licenses);
        
        res.json({ success: true, message: 'License deleted successfully' });
    } catch (error) {
        console.error('Error deleting license:', error);
        res.status(500).json({ message: 'Error deleting license' });
    }
});

module.exports = router;