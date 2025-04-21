<?php
/**
 * Block management API
 * 
 * Note: This file uses bindValue() instead of bindParam() throughout to avoid
 * "Only variables can be passed by reference" errors. If your IDE still shows these
 * errors, it may be a caching issue. Try refreshing your IDE or restarting it.
 */
require_once '../config.php';

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getBlocks();
        break;
    case 'POST':
        createBlock();
        break;
    case 'PUT':
        updateBlock();
        break;
    case 'DELETE':
        deleteBlock();
        break;
    default:
        sendResponse(['error' => 'Method not supported'], 405);
}

/**
 * Get all blocks or a specific block by ID
 */
function getBlocks() {
    global $pdo;
    
    try {
        // Check if ID is provided
        $blockId = isset($_GET['id']) ? (int)$_GET['id'] : null;
        
        if ($blockId) {
            // Get a specific block
            $blocks = getBlockById($blockId);
            
            if (!$blocks) {
                sendResponse(['error' => 'Block not found'], 404);
            }
            
            sendResponse($blocks);
        } else {
            // Get all blocks
            $stmt = $pdo->query('SELECT id FROM blocks ORDER BY id DESC');
            $blockIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $blocks = [];
            foreach ($blockIds as $id) {
                $blocks[] = getBlockById($id);
            }
            
            sendResponse($blocks);
        }
    } catch (PDOException $e) {
        logError('Error fetching blocks', $e);
        sendResponse(['error' => 'Error fetching blocks'], 500);
    }
}

/**
 * Create a new block
 */
function createBlock() {
    global $pdo;
    
    try {
        $data = getRequestData();
        
        if (!isset($data['tenKhoi']) || !isset($data['loaiKhoi']) || !isset($data['canNang'])) {
            sendResponse(['error' => 'Missing required fields'], 400);
        }
        
        $pdo->beginTransaction();
        
        // Insert basic block data
        $stmt = $pdo->prepare('INSERT INTO blocks (tenKhoi, loaiKhoi, canNang, donViCanNang, chatLieu, moTa) 
                              VALUES (:tenKhoi, :loaiKhoi, :canNang, :donViCanNang, :chatLieu, :moTa)');
        
        $stmt->bindValue(':tenKhoi', $data['tenKhoi']);
        $stmt->bindValue(':loaiKhoi', $data['loaiKhoi']);
        $stmt->bindValue(':canNang', $data['canNang']);
        $stmt->bindValue(':donViCanNang', isset($data['donViCanNang']) ? $data['donViCanNang'] : 'g');
        $stmt->bindValue(':chatLieu', isset($data['chatLieu']) ? $data['chatLieu'] : null);
        $stmt->bindValue(':moTa', isset($data['moTa']) ? $data['moTa'] : null);
        
        $stmt->execute();
        $blockId = $pdo->lastInsertId();
        
        // Insert dimensions if provided
        if (isset($data['kichThuoc'])) {
            $stmt = $pdo->prepare('INSERT INTO block_dimensions (block_id, dai, rong, cao) 
                                  VALUES (:block_id, :dai, :rong, :cao)');
            
            $stmt->bindValue(':block_id', $blockId);
            $stmt->bindValue(':dai', isset($data['kichThuoc']['dai']) ? $data['kichThuoc']['dai'] : null);
            $stmt->bindValue(':rong', isset($data['kichThuoc']['rong']) ? $data['kichThuoc']['rong'] : null);
            $stmt->bindValue(':cao', isset($data['kichThuoc']['cao']) ? $data['kichThuoc']['cao'] : null);
            
            $stmt->execute();
        }
        
        // Insert color information if provided
        if (isset($data['mauSac'])) {
            $stmt = $pdo->prepare('INSERT INTO block_colors (block_id, maMau, moTa) 
                                  VALUES (:block_id, :maMau, :moTa)');
            
            $stmt->bindValue(':block_id', $blockId);
            $stmt->bindValue(':maMau', isset($data['mauSac']['maMau']) ? $data['mauSac']['maMau'] : null);
            $stmt->bindValue(':moTa', isset($data['mauSac']['moTa']) ? $data['mauSac']['moTa'] : null);
            
            $stmt->execute();
        }
        
        $pdo->commit();
        
        // Return the complete block data
        $newBlock = getBlockById($blockId);
        sendResponse($newBlock, 201);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        logError('Error creating block', $e);
        sendResponse(['error' => 'Error creating block'], 500);
    }
}

/**
 * Update an existing block
 */
function updateBlock() {
    global $pdo;
    
    try {
        $data = getRequestData();
        
        if (!isset($data['id'])) {
            sendResponse(['error' => 'Block ID is required'], 400);
        }
        
        $blockId = (int)$data['id'];
        
        // Check if block exists
        $stmt = $pdo->prepare('SELECT id FROM blocks WHERE id = ?');
        $stmt->execute([$blockId]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Block not found'], 404);
        }
        
        $pdo->beginTransaction();
        
        // Update basic block information
        $stmt = $pdo->prepare('UPDATE blocks SET 
                              tenKhoi = :tenKhoi,
                              loaiKhoi = :loaiKhoi,
                              canNang = :canNang,
                              donViCanNang = :donViCanNang,
                              chatLieu = :chatLieu,
                              moTa = :moTa
                              WHERE id = :id');
        
        $stmt->bindValue(':id', $blockId);
        $stmt->bindValue(':tenKhoi', $data['tenKhoi']);
        $stmt->bindValue(':loaiKhoi', $data['loaiKhoi']);
        $stmt->bindValue(':canNang', $data['canNang']);
        $stmt->bindValue(':donViCanNang', isset($data['donViCanNang']) ? $data['donViCanNang'] : 'g');
        $stmt->bindValue(':chatLieu', isset($data['chatLieu']) ? $data['chatLieu'] : null);
        $stmt->bindValue(':moTa', isset($data['moTa']) ? $data['moTa'] : null);
        
        $stmt->execute();
        
        // Update dimensions
        if (isset($data['kichThuoc'])) {
            // Delete existing dimensions
            $stmt = $pdo->prepare('DELETE FROM block_dimensions WHERE block_id = ?');
            $stmt->execute([$blockId]);
            
            // Insert new dimensions
            $stmt = $pdo->prepare('INSERT INTO block_dimensions (block_id, dai, rong, cao) 
                                  VALUES (:block_id, :dai, :rong, :cao)');
            
            $stmt->bindValue(':block_id', $blockId);
            $stmt->bindValue(':dai', isset($data['kichThuoc']['dai']) ? $data['kichThuoc']['dai'] : null);
            $stmt->bindValue(':rong', isset($data['kichThuoc']['rong']) ? $data['kichThuoc']['rong'] : null);
            $stmt->bindValue(':cao', isset($data['kichThuoc']['cao']) ? $data['kichThuoc']['cao'] : null);
            
            $stmt->execute();
        }
        
        // Update color information
        if (isset($data['mauSac'])) {
            // Delete existing color data
            $stmt = $pdo->prepare('DELETE FROM block_colors WHERE block_id = ?');
            $stmt->execute([$blockId]);
            
            // Insert new color data
            $stmt = $pdo->prepare('INSERT INTO block_colors (block_id, maMau, moTa) 
                                  VALUES (:block_id, :maMau, :moTa)');
            
            $stmt->bindValue(':block_id', $blockId);
            $stmt->bindValue(':maMau', isset($data['mauSac']['maMau']) ? $data['mauSac']['maMau'] : null);
            $stmt->bindValue(':moTa', isset($data['mauSac']['moTa']) ? $data['mauSac']['moTa'] : null);
            
            $stmt->execute();
        }
        
        $pdo->commit();
        
        // Return the updated block
        $updatedBlock = getBlockById($blockId);
        sendResponse($updatedBlock);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        logError('Error updating block', $e);
        sendResponse(['error' => 'Error updating block'], 500);
    }
}

/**
 * Delete one or multiple blocks
 */
function deleteBlock() {
    global $pdo;
    
    try {
        $data = getRequestData();
        
        // Allow deletion of multiple blocks or a single block
        $blockIds = [];
        
        if (isset($data['id'])) {
            // Single block deletion
            $blockIds = [(int)$data['id']];
        } else if (isset($data['ids']) && is_array($data['ids'])) {
            // Multiple block deletion
            $blockIds = array_map('intval', $data['ids']);
        } else {
            sendResponse(['error' => 'Block ID(s) required'], 400);
        }
        
        if (empty($blockIds)) {
            sendResponse(['error' => 'No valid block IDs provided'], 400);
        }
        
        $pdo->beginTransaction();
        
        $placeholders = implode(',', array_fill(0, count($blockIds), '?'));
        
        // Delete from blocks table (cascades to other tables due to foreign key constraints)
        $stmt = $pdo->prepare("DELETE FROM blocks WHERE id IN ($placeholders)");
        $stmt->execute($blockIds);
        
        $deletedCount = $stmt->rowCount();
        
        $pdo->commit();
        
        sendResponse(['message' => 'Blocks deleted successfully', 'count' => $deletedCount]);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        logError('Error deleting blocks', $e);
        sendResponse(['error' => 'Error deleting blocks'], 500);
    }
}

/**
 * Helper function to get block by ID with all related data
 */
function getBlockById($blockId) {
    global $pdo;
    
    // Get basic block info
    $stmt = $pdo->prepare('SELECT * FROM blocks WHERE id = ?');
    $stmt->execute([$blockId]);
    $block = $stmt->fetch();
    
    if (!$block) {
        return null;
    }
    
    // Get dimensions
    $stmt = $pdo->prepare('SELECT dai, rong, cao FROM block_dimensions WHERE block_id = ?');
    $stmt->execute([$blockId]);
    $dimensions = $stmt->fetch();
    
    if ($dimensions) {
        $block['kichThuoc'] = [
            'dai' => (float)$dimensions['dai'],
            'rong' => (float)$dimensions['rong'],
            'cao' => (float)$dimensions['cao']
        ];
    }
    
    // Get color information
    $stmt = $pdo->prepare('SELECT maMau, moTa FROM block_colors WHERE block_id = ?');
    $stmt->execute([$blockId]);
    $color = $stmt->fetch();
    
    if ($color) {
        $block['mauSac'] = [
            'maMau' => $color['maMau'],
            'moTa' => $color['moTa']
        ];
    }
    
    // Convert to appropriate types
    $block['id'] = (int)$block['id'];
    $block['canNang'] = (float)$block['canNang'];
    
    return $block;
}
