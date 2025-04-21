<?php
require_once '../config.php';

// Set up the admin user (only if it doesn't exist)
function setupAdmin() {
    global $pdo;
    
    // Check if users table exists
    try {
        $pdo->query("SELECT 1 FROM users LIMIT 1");
    } catch (PDOException $e) {
        // Create users table
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
    }
    
    // Check if admin exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = 'admin'");
    $stmt->execute();
    
    if (!$stmt->fetch()) {
        // Admin doesn't exist, create it
        $hashedPassword = password_hash('123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password, is_admin) VALUES ('admin', :password, TRUE)");
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->execute();
    }
}

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        login();
        break;
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'setup') {
            setupAdmin();
            sendResponse(['success' => true, 'message' => 'Admin user setup complete']);
        } else {
            sendResponse(['error' => 'Invalid request'], 400);
        }
        break;
    default:
        sendResponse(['error' => 'Method not supported'], 405);
}

/**
 * Handle login requests
 */
function login() {
    global $pdo;
    
    try {
        $data = getRequestData();
        
        if (!isset($data['username']) || !isset($data['password'])) {
            sendResponse(['error' => 'Username and password are required'], 400);
        }
        
        // Setup admin user if needed
        setupAdmin();
        
        // Check credentials
        $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
        $stmt->execute([$data['username']]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($data['password'], $user['password'])) {
            sendResponse(['error' => 'Invalid username or password'], 401);
        }
        
        // Generate basic session data
        $sessionData = [
            'username' => $user['username'],
            'expires' => time() + 3600, // 1 hour
            'user_id' => $user['id']
        ];
        
        sendResponse([
            'success' => true,
            'user' => $user['username'],
            'session' => $sessionData
        ]);
        
    } catch (PDOException $e) {
        logError('Login error', $e);
        sendResponse(['error' => 'Authentication failed'], 500);
    }
}
