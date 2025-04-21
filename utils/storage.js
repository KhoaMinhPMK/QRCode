/**
 * Storage utility functions for QR block data
 */

// Retrieve blocks data from localStorage
export function getBlocksData() {
    const data = localStorage.getItem('qrBlocksData');
    try {
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error parsing localStorage data:", e);
        return []; 
    }
}

// Save blocks data to localStorage
export function saveBlocksData(blocksArray) {
    localStorage.setItem('qrBlocksData', JSON.stringify(blocksArray));
}

// Check if block already exists in storage
export function isDuplicateBlock(newBlock) {
    const existingBlocks = getBlocksData();
    return existingBlocks.some(block => 
        block.tenKhoi === newBlock.tenKhoi &&
        block.loaiKhoi === newBlock.loaiKhoi &&
        block.canNang === newBlock.canNang
    );
}

// Add new block to storage
export function addBlock(blockData) {
    const existingBlocks = getBlocksData();
    const newBlockWithId = {
        ...blockData,
        id: Date.now()
    };
    
    existingBlocks.push(newBlockWithId);
    saveBlocksData(existingBlocks);
    return newBlockWithId;
}
