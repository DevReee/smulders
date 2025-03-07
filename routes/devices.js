const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const { createDevice, getAllDevices, updateDevice, deleteDevice } = require('../data/db');

const DEVICES_FILE = path.join(__dirname, '../data/storage/devices.json');

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

// Get all devices
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Check if file exists and create it with empty array if not
        try {
            await fs.access(DEVICES_FILE);
        } catch (err) {
            // File doesn't exist, create it with empty array
            await fs.writeFile(DEVICES_FILE, JSON.stringify([], null, 2));
        }
        
        // Read the file
        const data = await fs.readFile(DEVICES_FILE, 'utf8');
        
        // Parse JSON or return empty array if parsing fails
        let devices = [];
        try {
            if (data.trim()) {
                devices = JSON.parse(data);
            }
        } catch (parseError) {
            console.error('Error parsing devices JSON:', parseError);
            // If JSON is invalid, overwrite with empty array
            await fs.writeFile(DEVICES_FILE, JSON.stringify([], null, 2));
        }
        
        res.json(devices);
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ message: 'Error fetching devices' });
    }
});

// Add new device
router.post('/', authMiddleware, async (req, res) => {
    try {
        const device = await createDevice(req.body);
        res.status(201).json(device);
    } catch (error) {
        console.error('Error creating device:', error);
        res.status(500).json({ message: 'Error creating device' });
    }
});

// Update device
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const updatedDevice = await updateDevice(req.params.id, req.body);
        res.json(updatedDevice);
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({ message: 'Error updating device' });
    }
});

// Delete device
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await deleteDevice(req.params.id);
        res.json({ success: true, message: 'Device deleted successfully' });
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({ message: 'Error deleting device' });
    }
});
module.exports = router;
