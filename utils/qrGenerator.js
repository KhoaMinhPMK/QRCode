/**
 * QR code generation utilities using QRious library
 */

// Generate QR code and append to container
export function generateQRCode(container, data) {
    if (!container) {
        console.error("QR Code container not found");
        return null;
    }
    
    // Log để debug
    console.log('Generating QR for container:', container.id);
    console.log('With data:', data);
    
    try {
        // Clear any existing content
        container.innerHTML = '';
        
        // Create canvas element for QRious
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        // Convert data to string if it's not already
        const qrText = typeof data === 'string' ? data : JSON.stringify(data);
        
        // Check if QRious is available
        if (typeof QRious === 'undefined') {
            console.error("QRious library is not loaded!");
            container.innerHTML = '<p style="color: red">QR Code library not loaded</p>';
            return null;
        }
        
        // Create QR code using QRious
        const qr = new QRious({
            element: canvas,
            value: qrText,
            size: 256,
            backgroundAlpha: 1,
            foreground: '#000000',
            background: '#FFFFFF',
            level: 'H' // Error correction level
        });
        
        console.log('QR successfully generated with QRious');
        return qr;
        
    } catch (error) {
        console.error("Error generating QR code:", error);
        container.innerHTML = `<p style="color: red">Error generating QR code: ${error.message}</p>`;
        return null;
    }
}

// Create a blob URL for JSON download
export function createJsonDownloadLink(data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    return URL.createObjectURL(blob);
}

// Debounce function to limit QR generation frequency
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
