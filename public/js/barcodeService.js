/**
 * Barcode generation service for inventory labels
 */
class BarcodeService {
    /**
     * Generate a barcode image for the given inventory number
     * @param {string} inventoryNumber - The inventory number to encode
     * @returns {Promise<string>} - A promise that resolves to the data URL of the barcode image
     */
    static async generateBarcode(inventoryNumber) {
        // We'll use the JsBarcode library for barcode generation
        return new Promise((resolve, reject) => {
            try {
                // Create a canvas element
                const canvas = document.createElement('canvas');
                
                // Generate the barcode
                JsBarcode(canvas, inventoryNumber, {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 100,
                    displayValue: true,
                    fontSize: 20,
                    margin: 10,
                    background: "#ffffff",
                    text: inventoryNumber
                });
                
                // Convert the canvas to a data URL
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
            } catch (error) {
                console.error('Error generating barcode:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Create and download a barcode label for the given device
     * @param {Object} device - The device object
     */
    static async downloadBarcodeLabel(device) {
        try {
            if (!device || !device.inventoryNumber) {
                throw new Error('Invalid device or missing inventory number');
            }
            
            // Generate the barcode
            const barcodeDataUrl = await this.generateBarcode(device.inventoryNumber);
            
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = barcodeDataUrl;
            link.download = `label-${device.inventoryNumber}.png`;
            
            // Trigger the download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            console.error('Error downloading barcode label:', error);
            throw error;
        }
    }
}

export default BarcodeService;