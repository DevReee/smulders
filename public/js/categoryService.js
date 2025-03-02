class CategoryService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.baseUrl = '/api/categories';
    }

    async getAllCategories() {
        const response = await fetch(this.baseUrl, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    }

    async addCategory(categoryData) {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });
        if (!response.ok) throw new Error('Failed to add category');
        return response.json();
    }

    async deleteCategory(id) {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete category');
        }

        return await response.json();
    }
}

export default new CategoryService();
