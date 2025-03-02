class DeviceService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.baseUrl = '/api/devices';
    }

    async getAllDevices() {
        const response = await fetch(this.baseUrl, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch devices');
        return response.json();
    }

    async addDevice(deviceData) {
        try {
            const response = await fetch('/api/devices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(deviceData)
            });

            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error adding device:', error);
            throw error;
        }
    }

    async updateDevice(id, deviceData) {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deviceData)
        });
        if (!response.ok) throw new Error('Failed to update device');
        return response.json();
    }

    async deleteDevice(id) {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete device');
        }

        return await response.json();
    }
}

export default new DeviceService();
