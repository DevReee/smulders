require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initStorage } = require('./data/db');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Default route
app.get('/', (req, res) => {
    res.redirect('/login.html');
});
// Initialize storage
initStorage()
    .then(() => console.log('Storage initialized successfully'))
    .catch(err => console.error('Storage initialization failed:', err));

// Import routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const categoryRoutes = require('./routes/categories');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/categories', categoryRoutes);

// Catch-all route for SPA
app.get('*', (req, res) => {
    // Only redirect HTML requests to index.html, not API calls
    if (!req.path.startsWith('/api/') && req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ message: 'Not found' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
