// script.js (Đã thêm kiểm tra trùng lặp)

document.addEventListener('DOMContentLoaded', () => {
    // Lấy các phần tử từ DOM
    const tenKhoiInput = document.getElementById('tenKhoi');
    const loaiKhoiSelect = document.getElementById('loaiKhoi'); // Đã sửa lỗi chính tả
    const canNangInput = document.getElementById('canNang');
    const generateQrBtn = document.getElementById('generateQrBtn');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const outputSection = document.getElementById('outputSection');
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    const errorMessageDiv = document.getElementById('errorMessage');

    let currentJsonData = null; // Biến để lưu dữ liệu JSON hiện tại

    // Ẩn phần kết quả ban đầu
    outputSection.classList.add('hidden');
    errorMessageDiv.classList.add('hidden'); // Đảm bảo ẩn lỗi ban đầu

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


    // Lắng nghe sự kiện click trên nút "OK"
    generateQrBtn.addEventListener('click', () => {
        // Xóa thông báo lỗi cũ và ẩn phần kết quả QR
        errorMessageDiv.textContent = '';
        errorMessageDiv.classList.add('hidden');
        outputSection.classList.add('hidden');


        // Lấy giá trị từ các trường nhập liệu
        const tenKhoi = tenKhoiInput.value.trim();
        const loaiKhoi = loaiKhoiSelect.value;
        const canNangStr = canNangInput.value;
        const canNang = parseFloat(canNangStr); // Chuyển đổi sang số thực

        // --- Kiểm tra dữ liệu nhập ---
        if (!tenKhoi) {
            errorMessageDiv.textContent = 'Vui lòng nhập Tên khối.';
            errorMessageDiv.classList.remove('hidden');
            return; // Dừng lại
        }

        if (!loaiKhoi) {
            errorMessageDiv.textContent = 'Vui lòng chọn Loại khối.';
             errorMessageDiv.classList.remove('hidden');
            return;
        }

        if (isNaN(canNang) || canNang <= 0) {
            errorMessageDiv.textContent = 'Cân nặng phải là một số thực dương.';
            errorMessageDiv.classList.remove('hidden');
            return;
        }
        // --- Kết thúc kiểm tra nhập liệu ---

        // Chuẩn bị dữ liệu của khối mới (đã được validate)
        const newBlockData = {
            // Không thêm ID ở đây, ID sẽ được thêm nếu không trùng lặp
            tenKhoi: tenKhoi,
            loaiKhoi: loaiKhoi,
            canNang: canNang
        };

        // Lấy dữ liệu hiện có từ localStorage
        const existingBlocks = getBlocksData();

        // --- Kiểm tra trùng lặp ---
        let isDuplicate = false;
        for (const block of existingBlocks) {
            // So sánh 3 trường: Tên khối, Loại khối, Cân nặng
            // Sử dụng == hoặc === cho so sánh số
            if (block.tenKhoi === newBlockData.tenKhoi &&
                block.loaiKhoi === newBlockData.loaiKhoi &&
                block.canNang === newBlockData.canNang) {
                isDuplicate = true; // Đã tìm thấy khối trùng lặp
                break; // Thoát ngay khi tìm thấy
            }
        }

        // Nếu tìm thấy trùng lặp
        if (isDuplicate) {
            errorMessageDiv.textContent = 'Khối với thông tin này đã tồn tại.';
            errorMessageDiv.classList.remove('hidden');
            // Không làm gì thêm (không lưu, không tạo QR)
            return; // Dừng thực thi hàm
        }
        // --- Kết thúc kiểm tra trùng lặp ---


        // Nếu không trùng lặp, tiến hành thêm khối mới vào danh sách và lưu
        newBlockData.id = Date.now(); // Thêm ID chỉ khi không trùng lặp

        existingBlocks.push(newBlockData); // Thêm khối mới vào danh sách hiện có
        saveBlocksData(existingBlocks); // Lưu danh sách đã cập nhật vào localStorage

        // Lưu dữ liệu JSON của khối vừa tạo để tải sau
        currentJsonData = newBlockData; // Sử dụng newBlockData đã có ID

        // Chuyển dữ liệu thành chuỗi JSON để nhúng vào QR code
        const jsonString = JSON.stringify(newBlockData); // Mã hóa newBlockData có ID

        // --- Tạo mã QR ---
        // Xóa mã QR cũ nếu có
        qrCodeContainer.innerHTML = '';

        // Tạo mã QR mới
        // Đảm bảo phần tử qrCodeContainer đã tồn tại
        if (qrCodeContainer) {
             new QRCode(qrCodeContainer, {
                text: jsonString, // Dữ liệu cần mã hóa
                width: 256,      // Chiều rộng
                height: 256,     // Chiều cao
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H // Mức sửa lỗi cao
            });
        } else {
            console.error("QR Code Container element not found!");
        }

        // --- Kết thúc tạo mã QR ---

        // Hiển thị phần kết quả QR và nút tải JSON
        outputSection.classList.remove('hidden');
        errorMessageDiv.classList.add('hidden'); // Đảm bảo ẩn lỗi nếu thành công

        // Tùy chọn: Xóa dữ liệu nhập sau khi tạo thành công
        // tenKhoiInput.value = '';
        // loaiKhoiSelect.value = '';
        // canNangInput.value = '';
    });

    // Lắng nghe sự kiện click trên nút "Tải file Json"
    downloadJsonBtn.addEventListener('click', () => {
        // Nút tải này tải file JSON của khối VỪA ĐƯỢC TẠO (currentJsonData)
        if (currentJsonData) {
            // Tạo chuỗi JSON có định dạng đẹp (indent 2 spaces)
            const jsonString = JSON.stringify(currentJsonData, null, 2);

            // Tạo Blob từ chuỗi JSON
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Tạo URL cho Blob
            const url = URL.createObjectURL(blob);

            // Tạo một thẻ 'a' ẩn để tải file
            const a = document.createElement('a');
            a.href = url;
            // Sử dụng ID hoặc tên khối để đặt tên file
            const filename = `thong_tin_${currentJsonData.id || currentJsonData.tenKhoi.replace(/\s+/g, '_').toLowerCase()}.json`;
            a.download = filename;

            document.body.appendChild(a); // Cần thêm vào DOM để click hoạt động
            a.click(); // Kích hoạt sự kiện click để tải file

            // Dọn dẹp: xóa URL và thẻ 'a'
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Giải phóng bộ nhớ
        }
    });

    // Tùy chọn: Thêm liên kết đến trang danh sách (kiểm tra xem link đã tồn tại chưa)
    const existingLink = document.querySelector('a[href="list.html"]');
    if (!existingLink) {
        const listLink = document.createElement('a');
        listLink.href = 'list.html';
        listLink.textContent = 'Xem danh sách các khối';
        listLink.style.display = 'block'; // Mỗi liên kết một dòng
        listLink.style.marginTop = '20px';
        listLink.style.textAlign = 'center';
         // Tìm phần tử cha của nút OK để chèn liên kết vào đó
        const okButtonParent = generateQrBtn.parentElement;
        if(okButtonParent) {
             okButtonParent.insertBefore(listLink, generateQrBtn.nextSibling); // Chèn sau nút OK
        } else {
             // Trường hợp nút OK không có cha (ít xảy ra), chèn vào body
             document.body.appendChild(listLink);
        }
    }
});