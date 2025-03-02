import categoryService from './categoryService.js';

class CategoryManager {
    constructor() {
        this.categories = [];
        this.init();
    }

    async init() {
        await this.loadCategories();
        this.setupEventListeners();
    }

    async loadCategories() {
        try {
            this.categories = await categoryService.getAllCategories();
            this.renderCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            this.createNotification('error', 'Błąd podczas ładowania kategorii');
        }
    }

    setupEventListeners() {
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            this.showCategoryModal();
        });
    }

    showCategoryModal(category = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${category ? 'Edytuj kategorię' : 'Dodaj nową kategorię'}</h3>
                <form id="categoryForm" ${category ? 'data-id="' + category.id + '"' : ''}>
                    <div class="form-group">
                        <label>Nazwa kategorii</label>
                        <input type="text" name="name" required value="${category?.name || ''}" 
                               placeholder="Np. Komputer, Drukarka, itp.">
                    </div>
                    <div class="form-group">
                        <label>Opis</label>
                        <textarea name="description" required placeholder="Krótki opis kategorii">${category?.description || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="action-btn primary">
                            ${category ? 'Zapisz zmiany' : 'Dodaj kategorię'}
                        </button>
                        <button type="button" class="action-btn" onclick="this.closest('.modal').remove()">
                            Anuluj
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('#categoryForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const categoryData = Object.fromEntries(formData);

            try {
                const newCategory = await categoryService.addCategory(categoryData);
                this.categories.push(newCategory);
                this.renderCategories();
                this.createNotification('success', 'Kategoria została dodana');
                modal.remove();
            } catch (error) {
                console.error('Error adding category:', error);
                this.createNotification('error', 'Błąd podczas dodawania kategorii');
            }
        });
    }

    async addCategory(name, description) {
        try {
            const newCategory = await categoryService.addCategory({ name, description });
            this.categories.push(newCategory);
            this.renderCategories();
            this.createNotification('success', 'Kategoria została dodana');
        } catch (error) {
            console.error('Error adding category:', error);
            this.createNotification('error', 'Błąd podczas dodawania kategorii');
        }
    }

    async deleteCategory(id) {
        try {
            const shouldDelete = await this.showConfirmDialog(
                'Potwierdź usunięcie',
                'Czy na pewno chcesz usunąć tę kategorię?'
            );

            if (!shouldDelete) return;

            await categoryService.deleteCategory(id);
            
            // Usuń kategorię z lokalnej tablicy
            this.categories = this.categories.filter(category => category.id !== id);
            
            // Odśwież widok
            this.renderCategories();
            
            // Pokaż powiadomienie
            this.createNotification('success', 'Kategoria została usunięta');
        } catch (error) {
            this.createNotification('error', 'Nie udało się usunąć kategorii');
        }
    }

    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal confirm-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="confirm-actions">
                        <button class="action-btn delete" id="confirmYes">Tak</button>
                        <button class="action-btn" id="confirmNo">Nie</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('#confirmYes').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            modal.querySelector('#confirmNo').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
        });
    }

    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
    }

    renderCategories() {
        const container = document.querySelector('.categories-grid');
        if (!container) return;

        const content = this.categories.map(category => `
            <div class="category-card">
                <div class="category-icon">
                    <i class="fas fa-${category.icon}"></i>
                </div>
                <div class="category-info">
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                    <button class="action-btn delete" data-category-id="${category.id}">
                        <i class="fas fa-trash"></i> Usuń
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = content;

        // Dodaj nasłuchiwacze po wyrenderowaniu
        container.querySelectorAll('.action-btn.delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.categoryId;
                this.deleteCategory(categoryId);
            });
        });
    }

    // Metoda do generowania opcji dla selecta
    generateCategoryOptions(selectedCategory = '') {
        return this.categories.map(category => 
            `<option value="${category.id}" ${selectedCategory === category.id ? 'selected' : ''}>
                ${category.name}
            </option>`
        ).join('');
    }

    // Dodajemy nową metodę do tworzenia powiadomień
    createNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getCategoryName(id) {
        const category = this.categories.find(c => c.id === id);
        return category ? category.name : 'Nieznana kategoria';
    }
}

// Initialize when DOM is loaded
const categoryManager = new CategoryManager();
window.categoryManager = categoryManager;

export default CategoryManager;
