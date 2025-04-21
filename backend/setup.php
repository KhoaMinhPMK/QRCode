<?php
// Script to create necessary database tables
require_once 'config.php';

try {
    // Create blocks table
    $sql = "CREATE TABLE IF NOT EXISTS blocks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenKhoi VARCHAR(255) NOT NULL,
        loaiKhoi VARCHAR(100) NOT NULL,
        canNang FLOAT NOT NULL,
        donViCanNang VARCHAR(10) DEFAULT 'g',
        chatLieu VARCHAR(100),
        moTa TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sql);
    
    // Create block_dimensions table (for kichThuoc)
    $sql = "CREATE TABLE IF NOT EXISTS block_dimensions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        block_id INT NOT NULL,
        dai FLOAT,
        rong FLOAT,
        cao FLOAT,
        FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
    )";
    
    $pdo->exec($sql);
    
    // Create block_colors table (for mauSac)
    $sql = "CREATE TABLE IF NOT EXISTS block_colors (
        id INT PRIMARY KEY AUTO_INCREMENT,
        block_id INT NOT NULL,
        maMau VARCHAR(50),
        moTa VARCHAR(255),
        FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
    )";
    
    $pdo->exec($sql);
    
    sendResponse(['message' => 'Database setup completed successfully']);
    
} catch (PDOException $e) {
    logError('Database setup failed', $e);
    sendResponse(['error' => 'Database setup failed: ' . $e->getMessage()], 500);
}
