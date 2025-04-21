/**
 * Authentication utilities
 */

// Thông tin tài khoản cố định
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123';

// Auth constants
const AUTH_KEY = 'webqr_auth';
const SESSION_DURATION = 3600000; // 1 hour in milliseconds

// Check if user is logged in
export function checkAuth() {
    try {
        const authData = JSON.parse(localStorage.getItem(AUTH_KEY));
        if (!authData) return false;
        
        // Check if session has expired
        const now = new Date().getTime();
        if (now > authData.expires) {
            logout(); // Clean up expired session
            return false;
        }
        
        // Extend session
        authData.expires = now + SESSION_DURATION;
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        
        return true;
    } catch (e) {
        console.error('Auth check error:', e);
        return false;
    }
}

// Login function
export function login(username, password) {
    // Validate credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Create session
        const now = new Date().getTime();
        const authData = {
            username: username,
            expires: now + SESSION_DURATION
        };
        
        // Save to localStorage
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        
        return true;
    }
    
    return false;
}

// Logout function
export function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
}

// Get current user info
export function getCurrentUser() {
    try {
        const authData = JSON.parse(localStorage.getItem(AUTH_KEY));
        return authData ? authData.username : null;
    } catch (e) {
        return null;
    }
}

// Require authentication for protected pages
export function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}
