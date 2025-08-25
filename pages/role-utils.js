/**
 * Role Management Utilities for Phluowise
 * Handles automatic role setting, authentication checks, and session management
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
 * Set user role based on login source
 * @param {string} role - 'admin' or 'branch'
 */
function setUserRole(role) {
    if (role === ROLES.ADMIN || role === ROLES.BRANCH) {
        localStorage.setItem(STORAGE_KEYS.ROLE, role);
        console.log(`Role set to: ${role}`);
    } else {
        console.error('Invalid role specified:', role);
    }
}

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
 * Redirect user based on their current role
 * @param {string} fallbackUrl - URL to redirect to if no role is set
 */
function redirectBasedOnRole(fallbackUrl = 'user-signin.html') {
    const currentRole = getCurrentRole();
    
    if (!currentRole) {
        window.location.href = fallbackUrl;
        return;
    }
    
    if (currentRole === ROLES.ADMIN) {
        window.location.href = 'home.html';
    } else if (currentRole === ROLES.BRANCH) {
        window.location.href = 'home.html';
    } else {
        window.location.href = fallbackUrl;
    }
}

/**
 * Check if user should be redirected from current page
 * @param {string} expectedRole - Role expected for current page
 * @param {string} redirectUrl - URL to redirect to if role doesn't match
 */
function checkPageAccess(expectedRole, redirectUrl = 'home.html') {
    const currentRole = getCurrentRole();
    
    if (!currentRole) {
        // No role set, redirect to login
        window.location.href = 'user-signin.html';
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
 * Auto-set role based on current page URL
 * This should be called on login pages to automatically set the role
 */
function autoSetRoleFromPage() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'user-signin.html') {
        // User is on admin login page, set role as admin
        setUserRole(ROLES.ADMIN);
    } else if (currentPage === 'branch-signin.html') {
        // User is on branch login page, set role as branch
        setUserRole(ROLES.BRANCH);
    }
}

/**
 * Initialize role management for the current page
 * @param {string} expectedRole - Expected role for current page
 */
function initializeRoleManagement(expectedRole = null) {
    // Auto-set role if on login pages
    autoSetRoleFromPage();
    
    // Check page access if expected role is specified
    if (expectedRole) {
        checkPageAccess(expectedRole);
    }
    
    // Log current role for debugging
    console.log('Current role:', getCurrentRole());
}

// Export functions for use in other scripts
window.RoleUtils = {
    setUserRole,
    getCurrentRole,
    isAuthenticatedAs,
    isAuthenticated,
    clearAllSessions,
    clearRoleData,
    redirectBasedOnRole,
    checkPageAccess,
    autoSetRoleFromPage,
    initializeRoleManagement,
    ROLES,
    STORAGE_KEYS
};
