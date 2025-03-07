const express = require('express');
const router = express.Router();
const { readFile, writeFile } = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');

const CATEGORIES_FILE = path.join(__dirname, '../data/storage/categories.json');

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

// Get all categories
router.get('/', authMiddleware, async (req, res) => {
    try {
        const data = await readFile(CATEGORIES_FILE, 'utf8');
        const categories = JSON.parse(data);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// Add new category
router.post('/', authMiddleware, async (req, res) => {
    try {
        const data = await readFile(CATEGORIES_FILE, 'utf8');
        const categories = JSON.parse(data);
        
        const newCategory = {
            id: String(Date.now()),
            name: req.body.name,
            description: req.body.description,
            icon: "box",
            createdAt: new Date().toISOString()
        };
        
        categories.push(newCategory);
        await writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
        
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: 'Error creating category' });
    }
});

// Update category
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const data = await readFile(CATEGORIES_FILE, 'utf8');
        let categories = JSON.parse(data);
        
        const categoryIndex = categories.findIndex(cat => cat.id === req.params.id);
        if (categoryIndex === -1) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        categories[categoryIndex] = {
            ...categories[categoryIndex],
            name: req.body.name,
            description: req.body.description,
            updatedAt: new Date().toISOString()
        };
        
        await writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
        res.json(categories[categoryIndex]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating category' });
    }
});

// Delete category - Fixed to use authMiddleware and correct fs functions
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const data = await readFile(CATEGORIES_FILE, 'utf8');
        const categories = JSON.parse(data);
        const newCategories = categories.filter(cat => cat.id !== req.params.id);
        
        await writeFile(CATEGORIES_FILE, JSON.stringify(newCategories, null, 2));
        
        res.json({ success: true, message: 'Kategoria została usunięta' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Nie udało się usunąć kategorii' });
    }
});

module.exports = router;
