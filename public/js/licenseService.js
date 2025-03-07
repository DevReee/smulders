/**
 * Service for managing software licenses
 */
class LicenseService {
    constructor() {
        this.apiUrl = '/api/licenses';
        this.token = localStorage.getItem('token');
    }

    /**
     * Get all licenses
     * @returns {Promise<Array>} Array of licenses
     */
    async getAllLicenses() {
        try {
            const response = await fetch(this.apiUrl, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch licenses');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching licenses:', error);
            throw error;
        }
    }

    /**
     * Add a new license
     * @param {Object} licenseData License data
     * @returns {Promise<Object>} Created license
     */
    async addLicense(licenseData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(licenseData)
            });

            if (!response.ok) {
                throw new Error('Failed to add license');
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding license:', error);
            throw error;
        }
    }

    /**
     * Update an existing license
     * @param {string} id License ID
     * @param {Object} licenseData Updated license data
     * @returns {Promise<Object>} Updated license
     */
    async updateLicense(id, licenseData) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(licenseData)
            });

            if (!response.ok) {
                throw new Error('Failed to update license');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating license:', error);
            throw error;
        }
    }

    /**
     * Delete a license
     * @param {string} id License ID
     * @returns {Promise<Object>} Response
     */
    async deleteLicense(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete license');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting license:', error);
            throw error;
        }
    }
}

export default new LicenseService();