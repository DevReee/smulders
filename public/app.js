import deviceService from './js/deviceService.js';
import { ThemeManager } from './js/themeManager.js';

class InventoryApp {
    constructor() {
        this.devices = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        // Sprawdź autoryzację
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        this.setupEventListeners();
        await this.loadDevices();
    }

    setupEventListeners() {
        // Nawigacja
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.switchPage(page);
            });
        });

        // Filtrowanie statusów
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.tab;
                this.filterDevices();
                this.setActiveTab(e.target);
            });
        });

        // Dodawanie urządzenia
        document.getElementById('addDeviceBtn')?.addEventListener('click', () => {
            this.showDeviceModal();
        });

        // Wyszukiwarka
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Wylogowanie
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        });
    }

    switchPage(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        document.querySelector(`.nav-link[data-page="${page}"]`).classList.add('active');
        
        const sections = ['devices-section', 'categories-section'];
        sections.forEach(section => {
            document.getElementById(section)?.classList.add('hidden');
        });

        document.getElementById(`${page}-section`)?.classList.remove('hidden');

        if (page === 'devices') {
            this.loadDevices();
        }
    }

    async loadDevices() {
        try {
            this.devices = await deviceService.getAllDevices();
            this.filterDevices();
        } catch (error) {
            this.showNotification('error', 'Nie udało się załadować urządzeń');
        }
    }

    filterDevices() {
        let filtered = [...this.devices];
        if (this.currentFilter !== 'all') {
            filtered = this.devices.filter(device => device.status === this.currentFilter);
        }
        this.renderDevices(filtered);
    }

    handleSearch(term) {
        const filtered = this.devices.filter(device => {
            const searchTerm = term.toLowerCase();
            return (
                device.name.toLowerCase().includes(searchTerm) ||
                device.serialNumber.toLowerCase().includes(searchTerm) ||
                device.location.toLowerCase().includes(searchTerm)
            );
        });
        this.renderDevices(filtered);
    }

    renderDevices(devices) {
        const container = document.querySelector('.devices-list');
        if (!container) return;

        if (!container.querySelector('table')) {
            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Nr inwentaryzacyjny</th>
                            <th>Nazwa</th>
                            <th>Kategoria</th>
                            <th>Numer seryjny</th>
                            <th>Lokalizacja</th>
                            <th>Status</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
        }

        const tbody = container.querySelector('tbody');
        tbody.innerHTML = devices.map(device => {
            // Upewnij się, że device.id istnieje
            if (!device.id) {
                console.error('Device without ID:', device);
                return '';
            }
            
            return `
                <tr>
                    <td><strong>${device.inventoryNumber || 'N/A'}</strong></td>
                    <td>${device.name}</td>
                    <td>${window.categoryManager?.getCategoryName(device.category) || device.category}</td>
                    <td>${device.serialNumber}</td>
                    <td>${device.location}</td>
                    <td><span class="status-badge ${device.status}">${this.translateStatus(device.status)}</span></td>
                    <td>
                        <button class="action-btn edit" data-id="${device.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-id="${device.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        this.attachActionHandlers();
    }

    translateStatus(status) {
        const statusMap = {
            'active': 'Aktywne',
            'repair': 'W naprawie',
            'retired': 'Wycofane'
        };
        return statusMap[status] || status;
    }

    setActiveTab(targetBtn) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        targetBtn.classList.add('active');
    }

    attachActionHandlers() {
        // Edycja
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.editDevice(id);
            });
        });

        // Usuwanie
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteDevice(id);
            });
        });
    }

    async editDevice(id) {
        const device = this.devices.find(d => d.id === id);
        if (device) {
            this.showDeviceModal(device);
        }
    }

    async deleteDevice(id) {
        try {
            // Sprawdź czy ID istnieje
            if (!id) {
                this.showNotification('error', 'Nieprawidłowe ID urządzenia');
                return;
            }

            const confirmed = await this.showConfirmDialog(
                'Potwierdzenie', 
                'Czy na pewno chcesz usunąć to urządzenie?'
            );
            
            if (!confirmed) return;
    
            await deviceService.deleteDevice(id);
            
            // Aktualizuj lokalną listę
            this.devices = this.devices.filter(d => d.id !== id);
            this.filterDevices();
            
            this.showNotification('success', 'Urządzenie zostało usunięte');
        } catch (error) {
            console.error('Error deleting device:', error);
            this.showNotification('error', 'Nie udało się usunąć urządzenia');
        }
    }

    showDeviceModal(device = null) {
        const modal = document.getElementById('deviceModal');
        modal.classList.remove('hidden');
        
        const categoryOptions = window.categoryManager?.generateCategoryOptions(device?.category) || '';
        
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${device ? 'Edytuj urządzenie' : 'Dodaj nowe urządzenie'}</h3>
                <form id="deviceForm" ${device ? 'data-id="' + device.id + '"' : ''}>
                    ${device ? `
                        <div class="form-group">
                            <label>Numer inwentaryzacyjny</label>
                            <input type="text" value="${device.inventoryNumber}" disabled>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label>Nazwa</label>
                        <input type="text" name="name" required value="${device?.name || ''}">
                    </div>
                    <div class="form-group">
                        <label>Kategoria</label>
                        <select name="category" required>
                            <option value="">Wybierz kategorię...</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Numer seryjny</label>
                        <input type="text" name="serialNumber" required value="${device?.serialNumber || ''}">
                    </div>
                    <div class="form-group">
                        <label>Lokalizacja</label>
                        <input type="text" name="location" required value="${device?.location || ''}">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" required>
                            <option value="active" ${device?.status === 'active' ? 'selected' : ''}>Aktywne</option>
                            <option value="repair" ${device?.status === 'repair' ? 'selected' : ''}>W naprawie</option>
                            <option value="retired" ${device?.status === 'retired' ? 'selected' : ''}>Wycofane</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="action-btn primary">
                            ${device ? 'Zapisz zmiany' : 'Dodaj urządzenie'}
                        </button>
                        <button type="button" class="action-btn" onclick="app.closeModal()">
                            Anuluj
                        </button>
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('deviceForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const deviceData = Object.fromEntries(formData);
            const deviceId = e.target.dataset.id;

            try {
                if (deviceId) {
                    await deviceService.updateDevice(deviceId, deviceData);
                    this.showNotification('success', 'Urządzenie zostało zaktualizowane');
                } else {
                    await deviceService.addDevice(deviceData);
                    this.showNotification('success', 'Urządzenie zostało dodane');
                }
                this.closeModal();
                await this.loadDevices();
            } catch (error) {
                this.showNotification('error', 'Wystąpił błąd podczas zapisywania');
            }
        });
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

    closeModal() {
        document.getElementById('deviceModal').classList.add('hidden');
    }

    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager
    new ThemeManager();
    
    // Initialize app
    const app = new InventoryApp();
    window.app = app;
});
