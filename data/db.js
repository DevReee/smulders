const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

// Data storage paths
const DATA_DIR = path.join(__dirname, 'storage');
const DEVICES_FILE = path.join(DATA_DIR, 'devices.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');

// Initialize storage
const initStorage = async () => {
    try {
        // Create data directory
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Initialize devices.json if it doesn't exist
        try {
            await fs.access(DEVICES_FILE);
        } catch {
            await fs.writeFile(DEVICES_FILE, JSON.stringify([], null, 2));
        }
        
        // Initialize categories.json if it doesn't exist
        try {
            await fs.access(CATEGORIES_FILE);
        } catch {
            await fs.writeFile(CATEGORIES_FILE, JSON.stringify([], null, 2));
        }
        
        // Initialize users.json if it doesn't exist
        try {
            await fs.access(USERS_FILE);
        } catch {
            const defaultUser = [{
                id: "1",
                username: "admin",
                password: "admin",
                role: "admin"
            }];
            await fs.writeFile(USERS_FILE, JSON.stringify(defaultUser, null, 2));
        }
        
        // Initialize licenses.json if it doesn't exist
        try {
            await fs.access(LICENSES_FILE);
        } catch {
            await fs.writeFile(LICENSES_FILE, JSON.stringify([], null, 2));
        }
    } catch (error) {
        console.error('Storage initialization error:', error);
        throw error;
    }
};

// File operations
const readFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeFile = async (filePath, data) => {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// User operations
const findUser = async (username) => {
    try {
        const users = await readFile(USERS_FILE);
        return users.find(user => user.username === username);
    } catch (error) {
        console.error('Error finding user:', error);
        return null;
    }
};

// Device operations
const getAllDevices = async () => {
    return await readFile(DEVICES_FILE);
};

async function getNextInventoryNumber() {
    const devices = await getAllDevices();
    const currentYear = new Date().getFullYear().toString().substr(2);
    
    const lastDeviceThisYear = devices
        .filter(d => d.inventoryNumber?.startsWith(`SMU${currentYear}`))
        .sort((a, b) => b.inventoryNumber.localeCompare(a.inventoryNumber))[0];
    
    const lastNumber = lastDeviceThisYear 
        ? parseInt(lastDeviceThisYear.inventoryNumber.slice(-4))
        : 0;
        
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `SMU${currentYear}${nextNumber}`;
}

const createDevice = async (deviceData) => {
    const devices = await getAllDevices();
    const inventoryNumber = await getNextInventoryNumber();
    
    const newDevice = {
        id: String(Date.now()),
        inventoryNumber,
        ...deviceData,
        createdAt: new Date().toISOString()
    };
    
    devices.push(newDevice);
    await writeFile(DEVICES_FILE, devices);
    return newDevice;
};

const updateDevice = async (id, deviceData) => {
    try {
        const devices = await getAllDevices();
        const index = devices.findIndex(device => device.id === id);
        
        if (index === -1) {
            throw new Error('Device not found');
        }

        // Zachowaj niektóre oryginalne pola
        const originalDevice = devices[index];
        devices[index] = {
            ...originalDevice,
            ...deviceData,
            id: originalDevice.id, // Upewnij się, że ID się nie zmieni
            updatedAt: new Date().toISOString()
        };

        await writeFile(DEVICES_FILE, devices);
        return devices[index];
    } catch (error) {
        console.error('Error updating device:', error);
        throw error;
    }
};

const deleteDevice = async (id) => {
    try {
        if (!id) {
            throw new Error('Device ID is required');
        }

        const devices = await getAllDevices();
        const deviceIndex = devices.findIndex(device => device.id === id);
        
        if (deviceIndex === -1) {
            throw new Error('Device not found');
        }

        devices.splice(deviceIndex, 1);
        await writeFile(DEVICES_FILE, devices);
        
        return { success: true, id };
    } catch (error) {
        console.error('Error deleting device:', error);
        throw error;
    }
};

module.exports = {
    initStorage,
    findUser,
    getAllDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    readFile,
    writeFile
};