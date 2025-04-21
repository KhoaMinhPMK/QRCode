<?php
// Database configuration
$db_host = 'localhost';
$db_name = 'u531045590_guide';
$db_user = 'u531045590_guide';
$db_pass = 'Khoaminh345678@';

// Establish database connection
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Set headers for CORS and JSON content type
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Read JSON data from request body
function getRequestData() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}

// Send JSON response
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Log errors to file
function logError($message, $error = null) {
    $errorLog = __DIR__ . '/error_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    $errorMessage = "[$timestamp] $message";
    
    if ($error) {
        $errorMessage .= ": " . $error->getMessage();
    }
    
    file_put_contents($errorLog, $errorMessage . PHP_EOL, FILE_APPEND);
}
