import { getBlocksData, saveBlocksData } from './utils/storage.js';
import { Notification } from './components/notification.js';

document.addEventListener('DOMContentLoaded', () => {
    const blockTableBody = document.getElementById('blockTableBody');
    const blocksTable = document.getElementById('blocksTable');
    const emptyListMessage = document.getElementById('emptyListMessage');
    const notification = new Notification();
    
    notification.init();

    // Hàm hiển thị dữ liệu lên bảng
    function displayBlocks() {
        const blocks = getBlocksData();

        // Xóa nội dung hiện tại của tbody
        blockTableBody.innerHTML = '';

        if (blocks.length === 0) {
            blocksTable.classList.add('hidden');
            emptyListMessage.classList.remove('hidden');
        } else {
            blocksTable.classList.remove('hidden');
            emptyListMessage.classList.add('hidden');

            // Duyệt qua từng khối và thêm vào bảng
            blocks.forEach((block) => {
                const row = blockTableBody.insertRow();

                // Thêm các ô dữ liệu
                const tenKhoiCell = row.insertCell();
                tenKhoiCell.textContent = block.tenKhoi;

                const loaiKhoiCell = row.insertCell();
                loaiKhoiCell.textContent = block.loaiKhoi;

                const canNangCell = row.insertCell();
                canNangCell.textContent = block.canNang;
                
                const idCell = row.insertCell();
                idCell.textContent = block.id;

                const actionCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Xóa';
                deleteButton.classList.add('delete-btn');
                deleteButton.dataset.id = block.id;
                
                const viewButton = document.createElement('button');
                viewButton.textContent = 'Xem';
                viewButton.classList.add('view-btn');
                viewButton.dataset.id = block.id;
                
                actionCell.appendChild(viewButton);
                actionCell.appendChild(deleteButton);
            });
        }
    }

    // Hàm xóa khối theo ID
    function deleteBlock(id) {
        let blocks = getBlocksData();
        const blockToDelete = blocks.find(block => block.id === id);
        const updatedBlocks = blocks.filter(block => block.id !== id);
        saveBlocksData(updatedBlocks);
        displayBlocks();
        
        if (blockToDelete) {
            notification.success(`Đã xóa khối "${blockToDelete.tenKhoi}"`);
        }
    }

    // Lắng nghe sự kiện click trên tbody
    blockTableBody.addEventListener('click', (event) => {
        const target = event.target;

        if (target.classList.contains('delete-btn')) {
            const blockId = parseInt(target.dataset.id);
            if (!isNaN(blockId)) {
                if (confirm(`Bạn có chắc chắn muốn xóa khối này?`)) {
                    deleteBlock(blockId);
                }
            }
        }
        
        if (target.classList.contains('view-btn')) {
            const blockId = parseInt(target.dataset.id);
            if (!isNaN(blockId)) {
                const blocks = getBlocksData();
                const block = blocks.find(b => b.id === blockId);
                if (block) {
                    // Open detail modal or redirect to detail page
                    viewBlockDetail(block);
                }
            }
        }
    });
    
    function viewBlockDetail(block) {
        // Create modal for block detail
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => document.body.removeChild(modal);
        
        const title = document.createElement('h2');
        title.textContent = `Chi tiết khối: ${block.tenKhoi}`;
        
        const details = document.createElement('div');
        details.className = 'block-details';
        details.innerHTML = `
            <p><strong>ID:</strong> ${block.id}</p>
            <p><strong>Tên khối:</strong> ${block.tenKhoi}</p>
            <p><strong>Loại khối:</strong> ${block.loaiKhoi}</p>
            <p><strong>Cân nặng:</strong> ${block.canNang} gam</p>
        `;
        
        const qrContainer = document.createElement('div');
        qrContainer.className = 'detail-qr-container';
        
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(details);
        modalContent.appendChild(qrContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Generate QR code for the block
        setTimeout(() => {
            new QRCode(qrContainer, {
                text: JSON.stringify(block),
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }, 100);
    }

    // Hiển thị dữ liệu khi trang được tải
    displayBlocks();
    
    // Add export functionality
    const exportBtn = document.getElementById('exportAllBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const blocks = getBlocksData();
            if (blocks.length === 0) {
                notification.warning('Không có dữ liệu để xuất');
                return;
            }
            
            const jsonString = JSON.stringify(blocks, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `all_blocks_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            notification.success('Đã xuất dữ liệu thành công');
        });
    }
});