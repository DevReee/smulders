require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initStorage } = require('./data/db');

const app = express();

// Default route
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
