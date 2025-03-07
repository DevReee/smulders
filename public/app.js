import deviceService from './js/deviceService.js';
import { ThemeManager } from './js/themeManager.js';
import BarcodeService from './js/barcodeService.js';
import licenseService from './js/licenseService.js';

class InventoryApp {
    constructor() {
        this.devices = [];
        this.licenses = [];
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

        // Dodawanie licencji
        document.getElementById('addLicenseBtn')?.addEventListener('click', () => {
            this.showLicenseModal();
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
        
        const sections = ['devices-section', 'categories-section', 'licenses-section'];
        sections.forEach(section => {
            document.getElementById(section)?.classList.add('hidden');
        });

        document.getElementById(`${page}-section`)?.classList.remove('hidden');

        if (page === 'devices') {
            this.loadDevices();
        } else if (page === 'licenses') {
            this.loadLicenses();
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

    async loadLicenses() {
        try {
            this.licenses = await licenseService.getAllLicenses();
            this.renderLicenses();
        } catch (error) {
            console.error('Error loading licenses:', error);
            this.showNotification('error', 'Nie udało się załadować licencji');
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
                device.serialNumber?.toLowerCase().includes(searchTerm) ||
                device.location?.toLowerCase().includes(searchTerm)
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
                    <td class="inventory-number-cell">
                        <div class="inventory-number-wrapper">
                            <strong>${device.inventoryNumber || 'N/A'}</strong>
                            ${device.inventoryNumber ? `
                                <button class="barcode-btn" data-inventory="${device.inventoryNumber}" title="Generuj naklejkę">
                                    <i class="fas fa-barcode"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                    <td>${device.name}</td>
                    <td>${window.categoryManager?.getCategoryName(device.category) || device.category || ''}</td>
                    <td>${device.serialNumber || ''}</td>
                    <td>${device.location || ''}</td>
                    <td><span class="status-badge ${device.status || ''}">${this.translateStatus(device.status)}</span></td>
                    <td>
                        <button class="action-btn edit" data-id="${device.id}" title="Edytuj">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-id="${device.id}" title="Usuń">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        this.attachDeviceActionHandlers();
    }

    renderLicenses() {
        const container = document.querySelector('.licenses-list');
        if (!container) return;

        const tbody = container.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = this.licenses.length ? this.licenses.map(license => {
            return `
                <tr>
                    <td>${license.softwareName || ''}</td>
                    <td>${license.licenseKey || ''}</td>
                    <td>${this.getDeviceName(license.deviceId) || 'Nie przypisano'}</td>
                    <td>${license.expirationDate ? new Date(license.expirationDate).toLocaleDateString() : 'Bezterminowa'}</td>
                    <td>${license.description || ''}</td>
                    <td>
                        <button class="action-btn edit" data-id="${license.id}" title="Edytuj">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-id="${license.id}" title="Usuń">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('') : `
            <tr>
                <td colspan="6" class="empty-table">Brak licencji. Dodaj pierwszą licencję klikając przycisk "Dodaj licencję".</td>
            </tr>
        `;

        this.attachLicenseActionHandlers();
    }

    getDeviceName(deviceId) {
        if (!deviceId) return null;
        const device = this.devices.find(d => d.id === deviceId);
        return device ? `${device.name} (${device.inventoryNumber || 'N/A'})` : null;
    }

    translateStatus(status) {
        const statusMap = {
            'active': 'Aktywne',
            'repair': 'W naprawie',
            'retired': 'Wycofane'
        };
        return statusMap[status] || status || '';
    }

    setActiveTab(targetBtn) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        targetBtn.classList.add('active');
    }

    attachDeviceActionHandlers() {
        // Edycja urządzenia
        document.querySelectorAll('.devices-list .action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.editDevice(id);
            });
        });

        // Usuwanie urządzenia
        document.querySelectorAll('.devices-list .action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteDevice(id);
            });
        });

        // Generowanie naklejki z kodem kreskowym
        document.querySelectorAll('.barcode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const inventoryNumber = e.currentTarget.dataset.inventory;
                this.generateBarcodeLabel(inventoryNumber);
            });
        });
    }

    attachLicenseActionHandlers() {
        // Edycja licencji
        document.querySelectorAll('.licenses-list .action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.editLicense(id);
            });
        });

        // Usuwanie licencji
        document.querySelectorAll('.licenses-list .action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteLicense(id);
            });
        });
    }

    async generateBarcodeLabel(inventoryNumber) {
        try {
            if (!inventoryNumber) {
                this.showNotification('error', 'Brak numeru inwentaryzacyjnego');
                return;
            }

            // Pokaż modal z podglądem kodu kreskowego
            this.showBarcodeModal(inventoryNumber);
        } catch (error) {
            console.error('Error generating barcode:', error);
            this.showNotification('error', 'Nie udało się wygenerować kodu kreskowego');
        }
    }

    async showBarcodeModal(inventoryNumber) {
        try {
            const modal = document.createElement('div');
            modal.className = 'modal barcode-modal';
            modal.innerHTML = `
                <div class="modal-content barcode-content">
                    <h3>Naklejka inwentaryzacyjna</h3>
                    <div class="barcode-container">
                        <div class="barcode-loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Generowanie kodu...</span>
                        </div>
                        <div class="barcode-image" id="barcodeImage"></div>
                    </div>
                    <div class="inventory-details">
                        <p>Numer inwentaryzacyjny: <strong>${inventoryNumber}</strong></p>
                    </div>
                    <div class="barcode-actions">
                        <button class="action-btn primary" id="downloadBarcode">
                            <i class="fas fa-download"></i> Pobierz
                        </button>
                        <button class="action-btn" id="closeBarcode">
                            <i class="fas fa-times"></i> Zamknij
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Generuj kod kreskowy
            const barcodeDataUrl = await BarcodeService.generateBarcode(inventoryNumber);
            
            // Usuń loading i pokaż kod kreskowy
            const loadingEl = modal.querySelector('.barcode-loading');
            if (loadingEl) loadingEl.remove();
            
            const barcodeImageEl = modal.querySelector('#barcodeImage');
            if (barcodeImageEl) {
                const img = document.createElement('img');
                img.src = barcodeDataUrl;
                img.alt = `Kod kreskowy ${inventoryNumber}`;
                img.className = 'barcode-img';
                barcodeImageEl.appendChild(img);
            }

            // Obsługa przycisków
            modal.querySelector('#downloadBarcode').addEventListener('click', () => {
                this.downloadBarcodeImage(barcodeDataUrl, inventoryNumber);
            });

            modal.querySelector('#closeBarcode').addEventListener('click', () => {
                modal.remove();
            });
        } catch (error) {
            console.error('Error showing barcode modal:', error);
            this.showNotification('error', 'Nie udało się wygenerować podglądu naklejki');
        }
    }

    downloadBarcodeImage(dataUrl, inventoryNumber) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `naklejka-${inventoryNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showNotification('success', 'Naklejka została pobrana');
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

    async editLicense(id) {
        const license = this.licenses.find(l => l.id === id);
        if (license) {
            this.showLicenseModal(license);
        }
    }

    async deleteLicense(id) {
        try {
            if (!id) {
                this.showNotification('error', 'Nieprawidłowe ID licencji');
                return;
            }

            const confirmed = await this.showConfirmDialog(
                'Potwierdzenie', 
                'Czy na pewno chcesz usunąć tę licencję?'
            );
            
            if (!confirmed) return;
    
            await licenseService.deleteLicense(id);
            
            // Aktualizuj lokalną listę
            this.licenses = this.licenses.filter(l => l.id !== id);
            this.renderLicenses();
            
            this.showNotification('success', 'Licencja została usunięta');
        } catch (error) {
            console.error('Error deleting license:', error);
            this.showNotification('error', 'Nie udało się usunąć licencji');
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

    showLicenseModal(license = null) {
        const modal = document.getElementById('licenseModal');
        modal.classList.remove('hidden');
        
        // Przygotuj opcje dla urządzeń
        const deviceOptions = this.devices.map(device => 
            `<option value="${device.id}" ${license?.deviceId === device.id ? 'selected' : ''}>
                ${device.name} (${device.inventoryNumber || 'N/A'})
            </option>`
        ).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${license ? 'Edytuj licencję' : 'Dodaj nową licencję'}</h3>
                <form id="licenseForm" ${license ? 'data-id="' + license.id + '"' : ''}>
                    <div class="form-group">
                        <label>Nazwa oprogramowania</label>
                        <input type="text" name="softwareName" required value="${license?.softwareName || ''}">
                    </div>
                    <div class="form-group">
                        <label>Klucz licencyjny</label>
                        <input type="text" name="licenseKey" required value="${license?.licenseKey || ''}">
                    </div>
                    <div class="form-group">
                        <label>Przypisane urządzenie</label>
                        <select name="deviceId">
                            <option value="">-- Brak przypisania --</option>
                            ${deviceOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Data ważności</label>
                        <input type="date" name="expirationDate" value="${license?.expirationDate ? license.expirationDate.substring(0, 10) : ''}">
                        <small>Pozostaw puste dla licencji bezterminowych</small>
                    </div>
                    <div class="form-group">
                        <label>Opis</label>
                        <textarea name="description" rows="3">${license?.description || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="action-btn primary">
                            ${license ? 'Zapisz zmiany' : 'Dodaj licencję'}
                        </button>
                        <button type="button" class="action-btn" onclick="app.closeModal()">
                            Anuluj
                        </button>
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('licenseForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const licenseData = Object.fromEntries(formData);
            const licenseId = e.target.dataset.id;

            try {
                if (licenseId) {
                    await licenseService.updateLicense(licenseId, licenseData);
                    this.showNotification('success', 'Licencja została zaktualizowana');
                } else {
                    await licenseService.addLicense(licenseData);
                    this.showNotification('success', 'Licencja została dodana');
                }
                this.closeModal();
                await this.loadLicenses();
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
        document.getElementById('deviceModal')?.classList.add('hidden');
        document.getElementById('licenseModal')?.classList.add('hidden');
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