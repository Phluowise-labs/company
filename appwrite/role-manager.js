// Role Manager for Phluowise Business Dashboard
// Handles role-based routing and authentication

class RoleManager {
    constructor() {
        this.currentRole = this.getStoredRole();
        this.initializeRole();
    }

    // Get stored role from localStorage or default to 'branch'
    getStoredRole() {
        return localStorage.getItem('phluowise_role') || 'branch';
    }

    // Store role in localStorage
    setStoredRole(role) {
        localStorage.setItem('phluowise_role', role);
        this.currentRole = role;
    }

    // Initialize role-based interface
    initializeRole() {
        this.updateInterface();
        this.setupRoleSwitcher();
    }

    // Update interface based on current role
    updateInterface() {
        const roleIndicator = document.querySelector('.role-indicator');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (roleIndicator) {
            roleIndicator.textContent = this.currentRole === 'admin' ? 'Admin Mode' : 'Branch Mode';
            roleIndicator.className = `role-indicator ${this.currentRole === 'admin' ? 'admin-mode' : 'branch-mode'}`;
        }

        // Update navigation based on role
        this.updateNavigation();
        
        // Update content based on role
        this.updateContent();
    }

    // Update navigation menu based on role
    updateNavigation() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        if (this.currentRole === 'admin') {
            this.showAdminNavigation();
        } else {
            this.showBranchNavigation();
        }
    }

    // Show admin navigation
    showAdminNavigation() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        sidebar.innerHTML = `
            <div class="text-center mb-8">
                <img src="../images/phluowise_logo.svg" alt="Phluowise Logo">
            </div>
            
            <div class="space-y-6 text-white">
                <div>
                    <h2 class="text-gray-500 text-xs mb-3 font-semibold uppercase tracking-wider">DASHBOARD</h2>
                    <ul class="space-y-2">
                        <li class="flex items-center space-x-3 text-blue-400 bg-blue-900/20 p-3 rounded-lg">
                            <i class="fas fa-home text-lg"></i>
                            <span class="font-semibold">Dashboard</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('analytics')">
                            <i class="fas fa-chart-line text-lg"></i>
                            <span>Analytics</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('branches')">
                            <i class="fas fa-store text-lg"></i>
                            <span>Branches</span>
                        </li>
                    </ul>
                </div>
                
                <div>
                    <h2 class="text-gray-500 text-xs mb-3 font-semibold uppercase tracking-wider">OPERATIONS</h2>
                    <ul class="space-y-2">
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('orders')">
                            <i class="fas fa-shopping-cart text-lg"></i>
                            <span>Orders</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('products')">
                            <i class="fas fa-box text-lg"></i>
                            <span>Products</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('customers')">
                            <i class="fas fa-users text-lg"></i>
                            <span>Customers</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('drivers')">
                            <i class="fas fa-truck text-lg"></i>
                            <span>Drivers</span>
                        </li>
                    </ul>
                </div>
                
                <div>
                    <h2 class="text-gray-500 text-xs mb-3 font-semibold uppercase tracking-wider">FINANCE</h2>
                    <ul class="space-y-2">
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('payments')">
                            <i class="fas fa-credit-card text-lg"></i>
                            <span>Payments</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('transactions')">
                            <i class="fas fa-receipt text-lg"></i>
                            <span>Transactions</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('reports')">
                            <i class="fas fa-chart-pie text-lg"></i>
                            <span>Reports</span>
                        </li>
                    </ul>
                </div>
                
                <div>
                    <h2 class="text-gray-500 text-xs mb-3 font-semibold uppercase tracking-wider">SETTINGS</h2>
                    <ul class="space-y-2">
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('system')">
                            <i class="fas fa-cog text-lg"></i>
                            <span>System</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('users')">
                            <i class="fas fa-user-shield text-lg"></i>
                            <span>Users</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="mt-8 text-blue-600">
                <a target="_blank" href="https://concrete-aurora-836.notion.site/Phluowise-Business-Web-app-Documentation-1dcc077ea6428001984fed3965d129f6?pvs=4">
                    <p class="text-sm">Beta version (1.0.00)</p>
                </a>
            </div>
        `;
    }

    // Show branch navigation
    showBranchNavigation() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        sidebar.innerHTML = `
            <div class="text-center mb-8">
                <img src="../images/phluowise_logo.svg" alt="Phluowise Logo">
                <div class="mt-2">
                    <span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Branch Mode</span>
                </div>
            </div>
            
            <div class="space-y-6 text-white">
                <div>
                    <h2 class="text-gray-500 text-xs mb-3 font-semibold uppercase tracking-wider">BRANCH OPERATIONS</h2>
                    <ul class="space-y-2">
                        <li class="flex items-center space-x-3 text-blue-400 bg-blue-900/20 p-3 rounded-lg">
                            <i class="fas fa-home text-lg"></i>
                            <span class="font-semibold">Dashboard</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('inventory')">
                            <i class="fas fa-box text-lg"></i>
                            <span>Inventory</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('local-orders')">
                            <i class="fas fa-shopping-cart text-lg"></i>
                            <span>Local Orders</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('pickups')">
                            <i class="fas fa-truck text-lg"></i>
                            <span>Pickups</span>
                        </li>
                    </ul>
                </div>
                
                <div>
                    <h2 class="text-gray-500 text-xs mb-3 font-semibold uppercase tracking-wider">CUSTOMER SERVICE</h2>
                    <ul class="space-y-2">
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('walk-in')">
                            <i class="fas fa-users text-lg"></i>
                            <span>Walk-in Customers</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('phone-orders')">
                            <i class="fas fa-phone text-lg"></i>
                            <span>Phone Orders</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('returns')">
                            <i class="fas fa-undo text-lg"></i>
                            <span>Returns</span>
                        </li>
                    </ul>
                </div>
                
                <div>
                    <h2 class="text-gray-500 text-xs mb-3 font-semibold uppercase tracking-wider">STOCK MANAGEMENT</h2>
                    <ul class="space-y-2">
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('stock-levels')">
                            <i class="fas fa-warehouse text-lg"></i>
                            <span>Stock Levels</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('transfers')">
                            <i class="fas fa-exchange-alt text-lg"></i>
                            <span>Transfers</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('stock-count')">
                            <i class="fas fa-clipboard-list text-lg"></i>
                            <span>Stock Count</span>
                        </li>
                    </ul>
                </div>
                
                <div>
                    <h2 class="text-gray-500 text-xs mb-3 font-semibold uppercase tracking-wider">REPORTS</h2>
                    <ul class="space-y-2">
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('daily-sales')">
                            <i class="fas fa-chart-bar text-lg"></i>
                            <span>Daily Sales</span>
                        </li>
                        <li class="flex items-center space-x-3 text-gray-300 hover:text-blue-400 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer" onclick="roleManager.navigateTo('end-of-day')">
                            <i class="fas fa-file-alt text-lg"></i>
                            <span>End of Day</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="mt-8 text-blue-600">
                <a target="_blank" href="https://concrete-aurora-836.notion.site/Phluowise-Business-Web-app-Documentation-1dcc077ea6428001984fed3965d129f6?pvs=4">
                    <p class="text-sm">Beta version (1.0.00)</p>
                </a>
            </div>
        `;
    }

    // Update content based on role
    updateContent() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        if (this.currentRole === 'admin') {
            this.loadAdminContent();
        } else {
            this.loadBranchContent();
        }
    }

    // Load admin content
    loadAdminContent() {
        // This would typically load admin-specific content
        // For now, we'll just update the page title and role indicator
        document.title = 'Admin Dashboard - Phluowise';
        this.updatePageHeader('Admin Dashboard', 'Welcome back, Administrator');
    }

    // Load branch content
    loadBranchContent() {
        // This would typically load branch-specific content
        // For now, we'll just update the page title and role indicator
        document.title = 'Branch Dashboard - Phluowise';
        this.updatePageHeader('Branch Dashboard', 'North Branch - Welcome back, Branch Manager');
    }

    // Update page header
    updatePageHeader(title, subtitle) {
        const headerTitle = document.querySelector('.page-title');
        const headerSubtitle = document.querySelector('.page-subtitle');
        
        if (headerTitle) headerTitle.textContent = title;
        if (headerSubtitle) headerSubtitle.textContent = subtitle;
    }

    // Setup role switcher in top bar
    setupRoleSwitcher() {
        const topBar = document.querySelector('.top-bar');
        if (!topBar) return;

        // Add role switcher if it doesn't exist
        if (!document.querySelector('.role-switcher')) {
            const roleSwitcher = document.createElement('div');
            roleSwitcher.className = 'role-switcher flex items-center space-x-2 bg-gray-800 p-2 rounded-lg cursor-pointer';
            roleSwitcher.innerHTML = `
                <i class="fas fa-exchange-alt text-blue-400"></i>
                <span class="text-sm">Switch to ${this.currentRole === 'admin' ? 'Branch' : 'Admin'}</span>
            `;
            roleSwitcher.onclick = () => this.switchRole();
            
            // Insert before the user profile
            const userProfile = topBar.querySelector('.user-profile');
            if (userProfile) {
                userProfile.parentNode.insertBefore(roleSwitcher, userProfile);
            }
        }
    }

    // Switch between admin and branch roles
    switchRole() {
        const newRole = this.currentRole === 'admin' ? 'branch' : 'admin';
        this.setStoredRole(newRole);
        
        // Show confirmation
        Swal.fire({
            title: 'Role Switched!',
            text: `You are now in ${newRole} mode`,
            icon: 'success',
            confirmButtonText: 'Continue',
            timer: 2000,
            timerProgressBar: true
        }).then(() => {
            // Reload the page or update interface
            if (newRole === 'admin') {
                window.location.href = 'admin-home.html';
            } else {
                window.location.href = 'branch-home.html';
            }
        });
    }

    // Navigate to different sections (placeholder for future implementation)
    navigateTo(section) {
        console.log(`Navigating to ${section} in ${this.currentRole} mode`);
        // This would handle navigation to different sections
        // For now, just log the action
    }

    // Check if user has permission for specific action
    hasPermission(action) {
        const permissions = {
            admin: ['all'],
            branch: ['inventory', 'local-orders', 'pickups', 'customer-service', 'stock-management']
        };

        return permissions[this.currentRole].includes('all') || 
               permissions[this.currentRole].includes(action);
    }

    // Get current user role
    getCurrentRole() {
        return this.currentRole;
    }

    // Check if current user is admin
    isAdmin() {
        return this.currentRole === 'admin';
    }

    // Check if current user is branch staff
    isBranchStaff() {
        return this.currentRole === 'branch';
    }
}

// Initialize role manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.roleManager = new RoleManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoleManager;
}
