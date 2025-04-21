/**
 * QR Display component
 */
import { generateQRCode, createJsonDownloadLink } from '../utils/qrGenerator.js';

export class QRDisplay {
    constructor() {
        this.currentBlockData = null;
    }
    
    init() {
        this.qrCodeContainer = document.getElementById('qrCodeContainer');
        this.outputSection = document.getElementById('outputSection');
        this.downloadJsonBtn = document.getElementById('downloadJsonBtn');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for block saved event
        document.addEventListener('block-saved', (e) => {
            this.showQRCode(e.detail);
        });
        
        // Download JSON button
        if (this.downloadJsonBtn) {
            this.downloadJsonBtn.addEventListener('click', this.downloadJson.bind(this));
        }
    }
    
    showQRCode(blockData) {
        this.currentBlockData = blockData;
        
        // Generate QR code
        generateQRCode(this.qrCodeContainer, blockData);
        
        // Show output section
        this.outputSection.classList.remove('hidden');
    }
    
    downloadJson() {
        if (!this.currentBlockData) return;
        
        const url = createJsonDownloadLink(this.currentBlockData);
        const filename = `thong_tin_${this.currentBlockData.id || this.currentBlockData.tenKhoi.replace(/\s+/g, '_').toLowerCase()}.json`;
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
