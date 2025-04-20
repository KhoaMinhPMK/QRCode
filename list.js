// list.js

document.addEventListener('DOMContentLoaded', () => {
    const blockTableBody = document.getElementById('blockTableBody');
    const blocksTable = document.getElementById('blocksTable'); // Lấy cả bảng
    const emptyListMessage = document.getElementById('emptyListMessage');

    // Hàm để lấy dữ liệu khối từ localStorage
    function getBlocksData() {
        const data = localStorage.getItem('qrBlocksData');
        // Nếu không có dữ liệu, trả về mảng rỗng. Ngược lại, parse JSON string.
        // Bắt lỗi parse JSON nếu dữ liệu trong localStorage bị hỏng
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error parsing localStorage data:", e);
            return []; // Trả về mảng rỗng nếu parse lỗi
        }
    }

    // Hàm để lưu dữ liệu khối vào localStorage
    function saveBlocksData(blocksArray) {
        localStorage.setItem('qrBlocksData', JSON.stringify(blocksArray));
    }

    // Hàm hiển thị dữ liệu lên bảng
    function displayBlocks() {
        const blocks = getBlocksData();

        // Xóa nội dung hiện tại của tbody
        blockTableBody.innerHTML = '';

        if (blocks.length === 0) {
            blocksTable.classList.add('hidden'); // Ẩn bảng
            emptyListMessage.classList.remove('hidden'); // Hiển thị thông báo rỗng
        } else {
            blocksTable.classList.remove('hidden'); // Hiện bảng
            emptyListMessage.classList.add('hidden'); // Ẩn thông báo rỗng

            // Duyệt qua từng khối và thêm vào bảng
            blocks.forEach((block, index) => {
                const row = blockTableBody.insertRow(); // Thêm một hàng mới vào tbody

                // Thêm các ô dữ liệu
                const tenKhoiCell = row.insertCell();
                tenKhoiCell.textContent = block.tenKhoi;

                const loaiKhoiCell = row.insertCell();
                loaiKhoiCell.textContent = block.loaiKhoi;

                const canNangCell = row.insertCell();
                canNangCell.textContent = block.canNang; // Hiển thị số

                const actionCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Xóa';
                deleteButton.classList.add('delete-btn'); // Thêm class để style
                // Gắn ID của khối vào nút Xóa để dễ dàng xác định khi click
                deleteButton.dataset.id = block.id;
                actionCell.appendChild(deleteButton);
            });
        }
    }

    // Hàm xóa khối theo ID
    function deleteBlock(id) {
        let blocks = getBlocksData();
        // Lọc ra các khối có ID khác với ID cần xóa
        const updatedBlocks = blocks.filter(block => block.id !== id);
        saveBlocksData(updatedBlocks); // Lưu lại dữ liệu đã cập nhật
        displayBlocks(); // Cập nhật lại bảng hiển thị
    }

    // Lắng nghe sự kiện click trên tbody (sử dụng Event Delegation)
    // Giúp bắt sự kiện click của các nút Xóa được tạo động
    blockTableBody.addEventListener('click', (event) => {
        const target = event.target;

        // Kiểm tra xem phần tử được click có phải là nút Xóa không
        if (target.classList.contains('delete-btn')) {
            // Lấy ID từ data-id đã lưu trên nút
            const blockId = parseInt(target.dataset.id); // Chuyển đổi ID sang số (vì Date.now() là số)
            if (!isNaN(blockId)) {
                 // Hiển thị hộp thoại xác nhận trước khi xóa
                if (confirm(`Bạn có chắc chắn muốn xóa khối "${target.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.textContent}"?`)) {
                     deleteBlock(blockId); // Gọi hàm xóa
                }
            }
        }
    });

    // Hiển thị dữ liệu khi trang được tải
    displayBlocks();
});