const express = require('express');
const router = express.Router();
const { readFile, writeFile } = require('fs').promises;
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
        const data = await readFile(DEVICES_FILE, 'utf8');
        const devices = JSON.parse(data);
        res.json(devices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching devices' });
    }
});

// Add new device
router.post('/', async (req, res) => {
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
        const data = await readFile(DEVICES_FILE, 'utf8');
        let devices = JSON.parse(data);
        
        const deviceIndex = devices.findIndex(dev => dev.id === req.params.id);
        if (deviceIndex === -1) {
            return res.status(404).json({ message: 'Device not found' });
        }
        
        devices[deviceIndex] = {
            ...devices[deviceIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeFile(DEVICES_FILE, JSON.stringify(devices, null, 2));
        res.json(devices[deviceIndex]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating device' });
    }
});

// Delete device
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const data = await readFile(DEVICES_FILE, 'utf8');
        let devices = JSON.parse(data);
        
        const deviceExists = devices.some(dev => dev.id === req.params.id);
        if (!deviceExists) {
            return res.status(404).json({ message: 'Device not found' });
        }

        devices = devices.filter(dev => dev.id !== req.params.id);
        await writeFile(DEVICES_FILE, devices);
        
        res.json({ success: true, message: 'Device deleted successfully' });
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({ message: 'Error deleting device' });
    }
});

module.exports = router;
