/**
 * Role Management Utilities for Phluowise
 * Handles role checking and session management without automatic redirects
 */

// Role constants
const ROLES = {
    ADMIN: 'admin',
    BRANCH: 'branch'
};

// Storage keys
const STORAGE_KEYS = {
    ROLE: 'phluowise_role',
    AUTH_TOKEN: 'authToken',
    LOGIN_TOKEN: 'loginToken',
    OTP_PURPOSE: 'otpPurpose',
    OTP_TOKEN: 'otpToken',
    OTP_EMAIL: 'otpEmail',
    LOGGED_IN_COMPANY: 'loggedInCompany',
    LOGGED_IN_BRANCH: 'loggedInBranch',
    BRANCH_CODE: 'branchCode',
    BRANCH_MANAGER_INFO: 'branchManagerInfo'
};

/**
 * Get current user role
 * @returns {string|null} Current role or null if not set
 */
function getCurrentRole() {
    return localStorage.getItem(STORAGE_KEYS.ROLE);
}

/**
 * Check if user is authenticated with a specific role
 * @param {string} role - Role to check for
 * @returns {boolean} True if authenticated with specified role
 */
function isAuthenticatedAs(role) {
    const currentRole = getCurrentRole();
    return currentRole === role;
}

/**
 * Check if user is authenticated with any role
 * @returns {boolean} True if authenticated
 */
function isAuthenticated() {
    return getCurrentRole() !== null;
}

/**
 * Clear all authentication and role data
 */
function clearAllSessions() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    console.log('All sessions cleared');
}

/**
 * Clear only role-related data (keep other session data)
 */
function clearRoleData() {
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_BRANCH);
    localStorage.removeItem(STORAGE_KEYS.BRANCH_CODE);
    localStorage.removeItem(STORAGE_KEYS.BRANCH_MANAGER_INFO);
    console.log('Role data cleared');
}

/**
 * Check if user should be redirected from current page
 * @param {string} expectedRole - Role expected for current page
 * @param {string} redirectUrl - URL to redirect to if role doesn't match
 */
function checkPageAccess(expectedRole, redirectUrl = 'home.html') {
    const currentRole = getCurrentRole();
    
    if (!currentRole) {
        // No role set, redirect to appropriate login
        if (expectedRole === ROLES.ADMIN) {
            window.location.href = 'user-signin.html';
        } else if (expectedRole === ROLES.BRANCH) {
            window.location.href = 'branch-signin.html';
        } else {
            window.location.href = 'user-signin.html';
        }
        return false;
    }
    
    if (currentRole !== expectedRole) {
        // Wrong role for this page, redirect to home
        window.location.href = redirectUrl;
        return false;
    }
    
    return true;
}

/**
 * Initialize role management for the current page
 * @param {string} expectedRole - Expected role for current page
 */
function initializeRoleManagement(expectedRole = null) {
    // Check page access if expected role is specified
    if (expectedRole) {
        checkPageAccess(expectedRole);
    }
    
    // Log current role for debugging
    console.log('Current role:', getCurrentRole());
}

// Export functions for use in other scripts
window.RoleUtils = {
    getCurrentRole,
    isAuthenticatedAs,
    isAuthenticated,
    clearAllSessions,
    clearRoleData,
    checkPageAccess,
    initializeRoleManagement,
    ROLES,
    STORAGE_KEYS
};
