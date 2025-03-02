const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    serialNumber: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    status: { type: String, enum: ['active', 'repair', 'retired'], default: 'active' },
    purchaseDate: Date,
    lastMaintenance: Date,
    history: [{
        date: Date,
        action: String,
        description: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
