const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    name: { type: String, required: true }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const createAdminUser = async () => {
    try {
        const adminExists = await mongoose.model('User').findOne({ email: 'admin' });
        if (!adminExists) {
            const admin = new mongoose.model('User')({
                email: 'admin',
                password: 'admin',
                name: 'Administrator',
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

createAdminUser();

module.exports = mongoose.model('User', userSchema);
