# Role Management System - Phluowise

## Overview

The role management system automatically sets user roles based on which login page they use, ensuring proper separation between admin and branch users. This system prevents users from accessing both admin and branch accounts simultaneously in the same browser.

## How It Works

### 1. Automatic Role Setting

**Admin Login (`user-signin.html`):**
- Automatically sets role to `admin`
- Users are redirected to admin dashboard after successful login

**Branch Login (`branch-signin.html`):**
- Automatically sets role to `branch`
- Users are redirected to branch dashboard after successful login

### 2. Role Storage

The system stores the current role in localStorage:
```javascript
localStorage.setItem('phluowise_role', 'admin'); // or 'branch'
```

### 3. Session Management

**Login Success:**
- Role is automatically set based on login source
- User is redirected to `home.html` (role-based dashboard)

**Logout:**
- All role-related data is cleared
- User is redirected to appropriate login page

**Role Switching:**
- Clears all existing session data
- Redirects user to appropriate login page for new role

## Files Modified

### 1. `company-auth.js`
- **Admin Login**: Automatically sets `phluowise_role = 'admin'`
- **Branch Login**: Automatically sets `phluowise_role = 'branch'`
- **OTP Verification**: Ensures role is maintained after verification

### 2. `topbar.js`
- **Logout Function**: Clears all role-related data
- **Session Cleanup**: Removes role, branch, and authentication data

### 3. `home.html`
- **Authentication Check**: Verifies user has valid role before loading dashboard
- **Role Switching**: Provides interface to switch between admin/branch modes

### 4. `user-signin.html` & `branch-signin.html`
- **Session Validation**: Prevents users from accessing wrong login page
- **Auto-redirect**: Redirects authenticated users to appropriate dashboard

### 5. `role-utils.js` (New File)
- **Utility Functions**: Centralized role management functions
- **Constants**: Role and storage key definitions
- **Session Management**: Functions to clear and manage sessions

## Key Functions

### Role Management
```javascript
// Set user role
RoleUtils.setUserRole('admin'); // or 'branch'

// Get current role
const role = RoleUtils.getCurrentRole();

// Check authentication
if (RoleUtils.isAuthenticated()) { ... }

// Check specific role
if (RoleUtils.isAuthenticatedAs('admin')) { ... }
```

### Session Management
```javascript
// Clear all sessions
RoleUtils.clearAllSessions();

// Clear only role data
RoleUtils.clearRoleData();

// Redirect based on role
RoleUtils.redirectBasedOnRole();
```

### Access Control
```javascript
// Check page access
RoleUtils.checkPageAccess('admin', 'home.html');

// Initialize role management
RoleUtils.initializeRoleManagement();
```

## Security Features

### 1. Role Isolation
- Users cannot access both admin and branch accounts simultaneously
- Each login source sets a specific role
- Role switching requires re-authentication

### 2. Session Validation
- All pages check for valid role before loading
- Unauthorized access redirects to appropriate login page
- Session data is properly cleared on logout

### 3. Automatic Redirects
- Authenticated users are redirected to appropriate dashboard
- Wrong role access is prevented
- Clean session management across the system

## Usage Examples

### Setting Role on Login
```javascript
// In company-auth.js - Admin login success
localStorage.setItem('phluowise_role', 'admin');

// In company-auth.js - Branch login success  
localStorage.setItem('phluowise_role', 'branch');
```

### Checking Role on Page Load
```javascript
// In home.html
function checkAuthentication() {
    if (!RoleUtils.isAuthenticated()) {
        window.location.href = 'user-signin.html';
        return false;
    }
    return true;
}
```

### Clearing Sessions on Logout
```javascript
// In topbar.js
if (window.RoleUtils) {
    RoleUtils.clearAllSessions();
} else {
    // Fallback manual clearing
    // ... manual localStorage removal
}
```

## Benefits

1. **Automatic Role Management**: No manual role setting required
2. **Secure Separation**: Users cannot access both account types simultaneously
3. **Clean Sessions**: Proper cleanup on logout and role switching
4. **Centralized Logic**: All role management in one utility file
5. **Easy Maintenance**: Simple to modify and extend

## Troubleshooting

### Common Issues

1. **Role Not Set**: Check if login page is properly setting role
2. **Session Not Cleared**: Verify logout function is calling clearAllSessions()
3. **Wrong Redirects**: Ensure role checking logic is correct

### Debug Mode

Enable console logging to see role management in action:
```javascript
// Check current role
console.log('Current role:', RoleUtils.getCurrentRole());

// Check authentication status
console.log('Is authenticated:', RoleUtils.isAuthenticated());
```

## Future Enhancements

1. **Role Persistence**: Store role in database for cross-device access
2. **Permission System**: Add granular permissions within roles
3. **Session Timeout**: Implement automatic session expiration
4. **Multi-factor Authentication**: Add additional security layers
