import { getBlocksData, saveBlocksData, deleteBlock, deleteMultipleBlocks } from './utils/storage.js';
import { Notification } from './components/notification.js';
import { logout, getCurrentUser } from './utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const blockTableBody = document.getElementById('blockTableBody');
    const blocksTable = document.getElementById('blocksTable');
    const emptyListMessage = document.getElementById('emptyListMessage');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterType = document.getElementById('filterType');
    const filterMaterial = document.getElementById('filterMaterial');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const sortOptions = document.querySelectorAll('.sort-option');
    const selectAll = document.getElementById('selectAll');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const totalBlocksCount = document.getElementById('totalBlocks');
    const displayedBlocksCount = document.getElementById('displayedBlocks');
    const paginationContainer = document.getElementById('paginationContainer');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageNumbers = document.getElementById('pageNumbers');
    const selectedCount = document.getElementById('selectedCount');
    
    // Set up authentication related elements
    const currentUserElement = document.getElementById('currentUser');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (currentUserElement) {
        currentUserElement.textContent = getCurrentUser() || 'Admin';
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                logout();
            }
        });
    }
    
    // Initialize notification
    const notification = new Notification();
    notification.init();

    // State
    let allBlocks = [];
    let filteredBlocks = [];
    let currentPage = 1;
    const blocksPerPage = 10;
    let sortField = 'id';
    let sortDirection = 'desc';
    let selectedBlocks = new Set();
    
    // Initial load
    loadAndDisplayBlocks();

    // Load blocks and apply filters
    async function loadAndDisplayBlocks() {
        try {
            allBlocks = await getBlocksData();
            
            // Update total count
            updateBlockCounts();
            
            // Apply filters
            applyFilters();
            
            // Sort blocks
            sortBlocks();
            
            // Update pagination
            setupPagination();
            
            // Display blocks
            displayBlocks();
        } catch (error) {
            console.error("Error loading blocks:", error);
            notification.error("Không thể tải dữ liệu khối, vui lòng thử lại sau");
        }
    }

    // Apply current filters to blocks
    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const typeFilter = filterType.value;
        const materialFilter = filterMaterial.value;
        
        filteredBlocks = allBlocks.filter(block => {
            // Search filter
            const matchesSearch = 
                block.tenKhoi.toLowerCase().includes(searchTerm) || 
                block.loaiKhoi.toLowerCase().includes(searchTerm) ||
                (block.moTa && block.moTa.toLowerCase().includes(searchTerm)) ||
                String(block.id).includes(searchTerm);
            
            // Type filter
            const matchesType = !typeFilter || block.loaiKhoi === typeFilter;
            
            // Material filter
            const matchesMaterial = !materialFilter || 
                (block.chatLieu && block.chatLieu === materialFilter);
            
            return matchesSearch && matchesType && matchesMaterial;
        });
        
        updateBlockCounts();
    }
    
    // Sort blocks based on current sort field and direction
    function sortBlocks() {
        filteredBlocks.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];
            
            // Handle nested properties or undefined values
            if (sortField === 'kichThuoc') {
                aValue = a.kichThuoc ? 
                    (a.kichThuoc.dai || 0) * (a.kichThuoc.rong || 0) * (a.kichThuoc.cao || 0) : 0;
                bValue = b.kichThuoc ? 
                    (b.kichThuoc.dai || 0) * (b.kichThuoc.rong || 0) * (b.kichThuoc.cao || 0) : 0;
            }
            
            // Compare values based on sort direction
            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }
    
    // Setup pagination
    function setupPagination() {
        const totalPages = Math.ceil(filteredBlocks.length / blocksPerPage);
        
        // Enable/disable prev/next buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
        
        // Show/hide pagination if needed
        if (totalPages <= 1) {
            paginationContainer.classList.add('hidden');
        } else {
            paginationContainer.classList.remove('hidden');
            
            // Create page numbers
            pageNumbers.innerHTML = '';
            
            // Determine which page numbers to show
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, startPage + 4);
            
            // Always show at least 5 pages if possible
            if (endPage - startPage < 4) {
                startPage = Math.max(1, endPage - 4);
            }
            
            // Add first page if not included
            if (startPage > 1) {
                addPageButton(1);
                if (startPage > 2) {
                    addEllipsis();
                }
            }
            
            // Add page numbers
            for (let i = startPage; i <= endPage; i++) {
                addPageButton(i);
            }
            
            // Add last page if not included
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    addEllipsis();
                }
                addPageButton(totalPages);
            }
        }
    }
    
    function addPageButton(pageNum) {
        const button = document.createElement('button');
        button.textContent = pageNum;
        button.classList.add('page-number');
        if (pageNum === currentPage) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            currentPage = pageNum;
            displayBlocks();
            setupPagination();
        });
        pageNumbers.appendChild(button);
    }
    
    function addEllipsis() {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.className = 'ellipsis';
        pageNumbers.appendChild(ellipsis);
    }
    
    // Update block counts
    function updateBlockCounts() {
        if (totalBlocksCount) {
            totalBlocksCount.textContent = allBlocks.length;
        }
        if (displayedBlocksCount) {
            displayedBlocksCount.textContent = filteredBlocks.length;
        }
    }

    // Hiển thị dữ liệu lên bảng
    function displayBlocks() {
        // Calculate which blocks to display on current page
        const startIndex = (currentPage - 1) * blocksPerPage;
        const endIndex = Math.min(startIndex + blocksPerPage, filteredBlocks.length);
        const blocksToDisplay = filteredBlocks.slice(startIndex, endIndex);
        
        // Xóa nội dung hiện tại của tbody
        blockTableBody.innerHTML = '';

        if (filteredBlocks.length === 0) {
            blocksTable.classList.add('hidden');
            emptyListMessage.classList.remove('hidden');
        } else {
            blocksTable.classList.remove('hidden');
            emptyListMessage.classList.add('hidden');

            // Duyệt qua từng khối và thêm vào bảng
            blocksToDisplay.forEach((block) => {
                const row = blockTableBody.insertRow();
                
                // Checkbox column
                const checkboxCell = row.insertCell();
                checkboxCell.className = 'checkbox-column';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.dataset.id = block.id;
                checkbox.checked = selectedBlocks.has(block.id);
                checkbox.addEventListener('change', handleCheckboxChange);
                checkboxCell.appendChild(checkbox);

                // Thêm các ô dữ liệu
                const tenKhoiCell = row.insertCell();
                tenKhoiCell.innerHTML = `<div class="block-name">${block.tenKhoi}</div>`;

                const loaiKhoiCell = row.insertCell();
                loaiKhoiCell.innerHTML = `<span class="block-type">${getBlockTypeIcon(block.loaiKhoi)} ${block.loaiKhoi}</span>`;

                const canNangCell = row.insertCell();
                canNangCell.textContent = `${block.canNang} ${block.donViCanNang || 'g'}`;
                
                // Kích thước
                const kichThuocCell = row.insertCell();
                if (block.kichThuoc) {
                    const dimensions = [];
                    if (block.kichThuoc.dai) dimensions.push(`D: ${block.kichThuoc.dai}cm`);
                    if (block.kichThuoc.rong) dimensions.push(`R: ${block.kichThuoc.rong}cm`);
                    if (block.kichThuoc.cao) dimensions.push(`C: ${block.kichThuoc.cao}cm`);
                    kichThuocCell.textContent = dimensions.length > 0 ? dimensions.join(' × ') : '-';
                } else {
                    kichThuocCell.textContent = '-';
                }
                
                // Chất liệu và màu sắc
                const chatLieuCell = row.insertCell();
                
                if (block.chatLieu && block.mauSac) {
                    // Hiển thị màu sắc dưới dạng mẫu màu
                    const colorSample = block.mauSac.maMau ? 
                        `<span class="color-sample" style="background-color: ${block.mauSac.maMau}"></span>` : '';
                        
                    chatLieuCell.innerHTML = `${block.chatLieu} ${colorSample}`;
                } else if (block.chatLieu) {
                    chatLieuCell.textContent = block.chatLieu;
                } else if (block.mauSac) {
                    // Chỉ có màu sắc
                    const colorSample = block.mauSac.maMau ? 
                        `<span class="color-sample" style="background-color: ${block.mauSac.maMau}"></span>` : '';
                    chatLieuCell.innerHTML = colorSample + (block.mauSac.moTa || '');
                } else {
                    chatLieuCell.textContent = '-';
                }
                
                const idCell = row.insertCell();
                idCell.textContent = block.id;

                const actionCell = row.insertCell();
                actionCell.className = 'actions-column';
                
                const viewButton = document.createElement('button');
                viewButton.innerHTML = '<i class="fas fa-eye"></i>';
                viewButton.title = 'Xem chi tiết';
                viewButton.className = 'action-btn view-btn';
                viewButton.dataset.id = block.id;
                
                const qrButton = document.createElement('button');
                qrButton.innerHTML = '<i class="fas fa-qrcode"></i>';
                qrButton.title = 'Xem mã QR';
                qrButton.className = 'action-btn qr-btn';
                qrButton.dataset.id = block.id;
                
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.title = 'Xóa khối';
                deleteButton.className = 'action-btn delete-btn';
                deleteButton.dataset.id = block.id;
                
                actionCell.appendChild(viewButton);
                actionCell.appendChild(qrButton);
                actionCell.appendChild(deleteButton);
                
                // Show preview on hover
                row.addEventListener('mouseenter', () => createBlockPreview(row, block));
                row.addEventListener('mouseleave', removeBlockPreview);
            });
        }
        
        // Update selected count
        updateSelectedCount();
    }
    
    // Handle checkbox change
    function handleCheckboxChange(event) {
        const id = parseInt(event.target.dataset.id);
        
        if (event.target.checked) {
            selectedBlocks.add(id);
        } else {
            selectedBlocks.delete(id);
        }
        
        updateSelectedCount();
    }
    
    // Get icon for block type
    function getBlockTypeIcon(blockType) {
        const icons = {
            'Lap phuong': '<i class="fas fa-cube"></i>',
            'Non tron xoay': '<i class="fas fa-chess-pawn"></i>',
            'Tru tron xoay': '<i class="fas fa-chess-rook"></i>',
            'Cau': '<i class="fas fa-circle"></i>',
            'Hinh hop chu nhat': '<i class="fas fa-square"></i>',
        };
        
        return icons[blockType] || '<i class="fas fa-shapes"></i>';
    }
    
    // Update selected count
    function updateSelectedCount() {
        const count = selectedBlocks.size;
        
        if (selectedCount) {
            selectedCount.textContent = count;
        }
        
        if (count > 0) {
            deleteSelectedBtn.classList.remove('hidden');
        } else {
            deleteSelectedBtn.classList.add('hidden');
        }
        
        // Update select all checkbox
        if (selectAll) {
            const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
            const allChecked = checkboxes.length > 0 && 
                Array.from(checkboxes).every(cb => cb.checked);
                
            selectAll.checked = allChecked;
        }
    }
    
    // Create block preview on hover
    function createBlockPreview(row, block) {
        // Remove any existing previews
        removeBlockPreview();
        
        // Create preview element
        const preview = document.createElement('div');
        preview.className = 'block-preview';
        preview.id = 'blockPreview';
        
        // Add block details
        let previewContent = `
            <h3>${block.tenKhoi}</h3>
            <div class="preview-details">
                <div class="preview-section">
                    <p><strong>ID:</strong> ${block.id}</p>
                    <p><strong>Loại khối:</strong> ${block.loaiKhoi}</p>
                    <p><strong>Cân nặng:</strong> ${block.canNang} ${block.donViCanNang || 'g'}</p>
                </div>
        `;
        
        // Add dimensions if available
        if (block.kichThuoc && (block.kichThuoc.dai || block.kichThuoc.rong || block.kichThuoc.cao)) {
            previewContent += '<div class="preview-section dimensions-info"><h4>Kích thước:</h4>';
            if (block.kichThuoc.dai) previewContent += `<p><strong>Dài:</strong> ${block.kichThuoc.dai} cm</p>`;
            if (block.kichThuoc.rong) previewContent += `<p><strong>Rộng:</strong> ${block.kichThuoc.rong} cm</p>`;
            if (block.kichThuoc.cao) previewContent += `<p><strong>Cao:</strong> ${block.kichThuoc.cao} cm</p>`;
            
            // Tính thể tích nếu có đủ 3 chiều
            if (block.kichThuoc.dai && block.kichThuoc.rong && block.kichThuoc.cao) {
                const theTich = block.kichThuoc.dai * block.kichThuoc.rong * block.kichThuoc.cao;
                previewContent += `<p><strong>Thể tích:</strong> ${theTich.toFixed(2)} cm³</p>`;
            }
            
            previewContent += '</div>';
        }
        
        // Add material if available
        if (block.chatLieu) {
            previewContent += `<p><strong>Chất liệu:</strong> ${block.chatLieu}</p>`;
        }
        
        // Add color if available
        if (block.mauSac) {
            previewContent += '<div class="preview-section">';
            
            const colorDisplay = block.mauSac.maMau ? 
                `<div class="color-preview" style="background-color: ${block.mauSac.maMau}"></div>` : '';
                
            previewContent += `
                <div class="preview-color">
                    ${colorDisplay}
                    <div class="color-info">
                        <h4>Màu sắc</h4>
                        ${block.mauSac.moTa ? `<p>${block.mauSac.moTa}</p>` : ''}
                        ${block.mauSac.maMau ? `<p class="color-code">${block.mauSac.maMau}</p>` : ''}
                    </div>
                </div>
            `;
            previewContent += '</div>';
        }
        
        // Add description if available
        if (block.moTa) {
            previewContent += `
                <div class="preview-section preview-description">
                    <h4>Mô tả:</h4>
                    <p>${block.moTa}</p>
                </div>
            `;
        }
        
        // Add a hint
        previewContent += `
            <div class="preview-actions">
                <button class="preview-action view-action"><i class="fas fa-eye"></i> Xem chi tiết</button>
                <button class="preview-action qr-action"><i class="fas fa-qrcode"></i> Xem QR</button>
            </div>
        `;
        
        previewContent += '</div>'; // Close preview-details
        preview.innerHTML = previewContent;
        
        // Position the preview
        const rect = row.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate ideal position
        let left = rect.right + 20;
        let top = rect.top + window.scrollY;
        
        // Add to document to get actual dimensions
        preview.style.visibility = 'hidden';
        document.body.appendChild(preview);
        const previewRect = preview.getBoundingClientRect();
        
        // Adjust position if would go out of viewport
        if (left + previewRect.width > viewportWidth) {
            left = Math.max(10, rect.left - previewRect.width - 20);
        }
        
        // Adjust vertical position if needed
        if (top + previewRect.height > window.scrollY + viewportHeight) {
            top = Math.max(window.scrollY + 10, window.scrollY + viewportHeight - previewRect.height - 10);
        }
        
        // Apply calculated position
        preview.style.left = `${left}px`;
        preview.style.top = `${top}px`;
        preview.style.visibility = 'visible';
        
        // Add event listeners to preview buttons
        const viewAction = preview.querySelector('.view-action');
        const qrAction = preview.querySelector('.qr-action');
        
        if (viewAction) {
            viewAction.addEventListener('click', () => {
                removeBlockPreview();
                viewBlockDetail(block);
            });
        }
        
        if (qrAction) {
            qrAction.addEventListener('click', () => {
                removeBlockPreview();
                showQRModal(block);
            });
        }
    }

    // Remove block preview
    function removeBlockPreview() {
        const existingPreview = document.getElementById('blockPreview');
        if (existingPreview) {
            existingPreview.remove();
        }
    }

    // Hàm xóa khối theo ID
    async function deleteBlock(id) {
        try {
            const blockToDelete = allBlocks.find(block => block.id === id);
            
            // Delete from backend
            await deleteBlock(id);
            
            // Reload blocks
            await loadAndDisplayBlocks();
            
            if (blockToDelete) {
                notification.success(`Đã xóa khối "${blockToDelete.tenKhoi}"`);
            }
        } catch (error) {
            console.error("Error deleting block:", error);
            notification.error("Không thể xóa khối, vui lòng thử lại sau");
        }
    }
    
    // Delete selected blocks
    async function deleteSelectedBlocks() {
        if (selectedBlocks.size === 0) return;
        
        try {
            const blockIds = Array.from(selectedBlocks);
            const result = await deleteMultipleBlocks(blockIds);
            
            selectedBlocks.clear();
            
            // Reload blocks
            await loadAndDisplayBlocks();
            
            notification.success(`Đã xóa ${result.count || blockIds.length} khối`);
        } catch (error) {
            console.error("Error deleting blocks:", error);
            notification.error("Không thể xóa các khối đã chọn, vui lòng thử lại sau");
        }
    }

    // Lắng nghe sự kiện click trên tbody
    blockTableBody.addEventListener('click', (event) => {
        const target = event.target;
        const actionBtn = target.closest('.action-btn');
        
        if (!actionBtn) return;
        
        const blockId = parseInt(actionBtn.dataset.id);
        if (isNaN(blockId)) return;
        
        const block = allBlocks.find(b => b.id === blockId);
        if (!block) return;
        
        if (actionBtn.classList.contains('delete-btn')) {
            if (confirm(`Bạn có chắc chắn muốn xóa khối "${block.tenKhoi}"?`)) {
                deleteBlock(blockId);
            }
        }
        else if (actionBtn.classList.contains('view-btn')) {
            viewBlockDetail(block);
        }
        else if (actionBtn.classList.contains('qr-btn')) {
            showQRModal(block);
        }
    });
    
    // Event Listeners
    
    // Search input
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentPage = 1; // Reset to first page when searching
            applyFilters();
            sortBlocks();
            setupPagination();
            displayBlocks();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                applyFilters();
                sortBlocks();
                setupPagination();
                displayBlocks();
            }
        });
    }
    
    // Apply filter button
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            currentPage = 1;
            applyFilters();
            sortBlocks();
            setupPagination();
            displayBlocks();
        });
    }
    
    // Sort options
    if (sortOptions) {
        sortOptions.forEach(option => {
            option.addEventListener('click', () => {
                const field = option.dataset.sort;
                
                // Toggle direction if clicking the same field
                if (sortField === field) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortField = field;
                    sortDirection = 'asc';
                }
                
                // Update UI to show sort direction
                sortOptions.forEach(opt => {
                    const dirElement = opt.querySelector('.sort-direction');
                    if (opt.dataset.sort === sortField) {
                        dirElement.textContent = sortDirection === 'asc' ? '↑' : '↓';
                    } else {
                        dirElement.textContent = '';
                    }
                });
                
                sortBlocks();
                displayBlocks();
            });
        });
    }
    
    // Select all checkbox
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAll.checked;
                
                const id = parseInt(checkbox.dataset.id);
                if (selectAll.checked) {
                    selectedBlocks.add(id);
                } else {
                    selectedBlocks.delete(id);
                }
            });
            
            updateSelectedCount();
        });
    }
    
    // Delete selected button
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', () => {
            if (selectedBlocks.size === 0) return;
            
            if (confirm(`Bạn có chắc chắn muốn xóa ${selectedBlocks.size} khối đã chọn?`)) {
                deleteSelectedBlocks();
            }
        });
    }
    
    // Pagination buttons
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayBlocks();
                setupPagination();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredBlocks.length / blocksPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayBlocks();
                setupPagination();
            }
        });
    }
    
    // Export all button
    const exportBtn = document.getElementById('exportAllBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                const blocks = await getBlocksData();
                
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
            } catch (error) {
                console.error("Error exporting blocks:", error);
                notification.error("Không thể xuất dữ liệu, vui lòng thử lại sau");
            }
        });
    }
    
    // Toggle filter dropdown
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            const filterContent = document.querySelector('.filter-content');
            filterContent.classList.toggle('show');
        });
    }
    
    // Toggle sort dropdown
    const sortBtn = document.querySelector('.sort-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            const sortContent = document.querySelector('.sort-content');
            sortContent.classList.toggle('show');
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.matches('.filter-btn') && !e.target.closest('.filter-content')) {
            const filterContent = document.querySelector('.filter-content');
            if (filterContent && filterContent.classList.contains('show')) {
                filterContent.classList.remove('show');
            }
        }
        
        if (!e.target.matches('.sort-btn') && !e.target.closest('.sort-content')) {
            const sortContent = document.querySelector('.sort-content');
            if (sortContent && sortContent.classList.contains('show')) {
                sortContent.classList.remove('show');
            }
        }
    });
});