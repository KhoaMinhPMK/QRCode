/**
 * QR code generation utilities
 */

// Generate QR code and append to container
export function generateQRCode(container, data) {
    if (!container) {
        console.error("QR Code container not found");
        return null;
    }
    
    // Clear any existing QR code
    container.innerHTML = '';
    
    try {
        // Create new QR code
        return new QRCode(container, {
            text: typeof data === 'string' ? data : JSON.stringify(data),
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (error) {
        console.error("Error generating QR code:", error);
        container.innerHTML = '<p class="qr-error">Error generating QR code</p>';
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
