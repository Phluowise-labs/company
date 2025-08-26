/**
 * Global Access Control System for Phluowise
 * This script enforces subscription-based access control across all pages
 */

class AccessControl {
    constructor() {
        this.isInitialized = false;
        this.subscriptionManager = null;
        this.init();
    }

    async init() {
        try {
            // Wait for subscription manager to be available
            await this.waitForSubscriptionManager();
            
            // Set up periodic checks
            this.startPeriodicChecks();
            
            // Check access immediately
            this.checkAccess();
            
            this.isInitialized = true;
            console.log('Access Control initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Access Control:', error);
        }
    }

    async waitForSubscriptionManager() {
        return new Promise((resolve) => {
            const checkManager = setInterval(() => {
                if (window.subscriptionManager) {
                    clearInterval(checkManager);
                    this.subscriptionManager = window.subscriptionManager;
                    resolve();
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkManager);
                console.warn('Subscription Manager not found, using fallback access control');
                resolve();
            }, 10000);
        });
    }

    startPeriodicChecks() {
        // Check access every 5 minutes
        setInterval(() => {
            this.checkAccess();
        }, 5 * 60 * 1000);
        
        // Check payment status every 3 hours (as per requirements)
        setInterval(() => {
            this.checkPaymentStatus();
        }, 3 * 60 * 60 * 1000);
    }

    checkAccess() {
        if (!this.subscriptionManager) {
            // Fallback: check if user is logged in
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            if (!isLoggedIn) {
                // For demo/testing purposes, don't redirect immediately
                console.log('No login status found, but continuing for demo purposes');
                return;
            }
            return;
        }

        const subscriptionData = this.subscriptionManager.subscriptionData;
        
        if (!subscriptionData) {
            console.warn('No subscription data available');
            return;
        }

        // Check if app should be blocked
        if (subscriptionData.isBlocked) {
            this.blockAccess();
            return;
        }

        // Check subscription status
        if (subscriptionData.status === 'expired' || subscriptionData.status === 'trial_expired') {
            this.blockAccess();
            return;
        }

        // Check if payment is overdue
        if (subscriptionData.paymentDueDate && new Date() > new Date(subscriptionData.paymentDueDate)) {
            this.blockAccess();
            return;
        }

        // Access granted - remove any existing blockers
        this.removeAccessBlocker();
    }

    blockAccess() {
        // Don't block on login/signup pages
        const currentPage = window.location.pathname.split('/').pop();
        if (['user-signin.html', 'user-signup.html', 'forgot_password.html', 'otp-verification.html'].includes(currentPage)) {
            return;
        }

        // Create access blocker if it doesn't exist
        if (!document.getElementById('access-blocker')) {
            const blocker = this.createAccessBlocker();
            document.body.appendChild(blocker);
            
            // Prevent scrolling
            document.body.style.overflow = 'hidden';
        }
    }

    createAccessBlocker() {
        const blocker = document.createElement('div');
        blocker.id = 'access-blocker';
        
        // Get subscription data for display
        let statusMessage = 'Access Blocked';
        let description = 'Your subscription has expired or payment is overdue.';
        let amountOwing = 0;
        let blockedAt = null;
        
        if (this.subscriptionManager && this.subscriptionManager.subscriptionData) {
            const data = this.subscriptionManager.subscriptionData;
            statusMessage = data.status === 'expired' ? 'Subscription Expired' : 'Payment Required';
            description = data.status === 'expired' 
                ? 'Your subscription has expired. Please renew to continue.' 
                : 'Payment is overdue. Please complete payment to restore access.';
            amountOwing = data.amountOwing || 0;
            blockedAt = data.blockedAt;
        }

        blocker.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-md z-[9999] flex items-center justify-center">
                <div class="bg-zinc-800 rounded-3xl p-8 max-w-lg mx-4 text-center relative">
                    <!-- Close button for emergency access -->
                    <button onclick="accessControl.emergencyAccess()" 
                            class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            title="Emergency Access (Admin Only)">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                    
                    <div class="text-red-400 text-6xl mb-4">
                        <i class="fas fa-lock"></i>
                    </div>
                    
                    <h2 class="text-2xl font-bold text-white mb-4">${statusMessage}</h2>
                    <p class="text-gray-300 mb-6">${description}</p>
                    
                    ${amountOwing > 0 ? `
                        <div class="bg-red-900/50 rounded-lg p-4 mb-6">
                            <div class="text-red-400 font-bold text-xl">Amount Owing: GH₵${amountOwing.toFixed(2)}</div>
                            ${blockedAt ? `
                                <div class="text-gray-400 text-sm mt-2">System blocked on: <span class="text-white">${new Date(blockedAt).toLocaleString()}</span></div>
                            ` : '<div class="text-red-500 text-sm font-bold mt-2">PAYMENT IS OVERDUE</div>' }
                        </div>
                    ` : ''}
                    
                    <div class="space-y-3">
                        <button onclick="accessControl.makePayment()" 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition">
                            <i class="fas fa-credit-card mr-2"></i>Make Payment
                        </button>
                        
                        <button onclick="accessControl.goToSubscription()" 
                                class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition">
                            <i class="fas fa-cog mr-2"></i>Manage Subscription
                        </button>
                        
                        <button onclick="accessControl.logout()" 
                                class="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition">
                            <i class="fas fa-sign-out-alt mr-2"></i>Logout
                        </button>
                    </div>
                    
                    <div class="mt-6 text-xs text-gray-500">
                        <p>Need help? Contact support at support@phluowise.com</p>
                    </div>
                </div>
            </div>
        `;

        return blocker;
    }

    removeAccessBlocker() {
        const blocker = document.getElementById('access-blocker');
        if (blocker) {
            blocker.remove();
            document.body.style.overflow = '';
        }
    }

    async checkPaymentStatus() {
        if (this.subscriptionManager) {
            try {
                await this.subscriptionManager.checkPaymentStatus();
            } catch (error) {
                console.error('Error checking payment status:', error);
            }
        }
    }

    // Action methods
    async makePayment() {
        if (this.subscriptionManager) {
            await this.subscriptionManager.makePayment();
        } else {
            // Fallback payment flow
            this.showPaymentOptions();
        }
    }

    goToSubscription() {
        window.location.href = 'subscription.html';
    }

    logout() {
        // Clear all data and redirect to login
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'user-signin.html';
    }

    emergencyAccess() {
        // Emergency access for admin purposes
        const password = prompt('Enter emergency access code:');
        if (password === 'admin123') { // Replace with secure method
            this.removeAccessBlocker();
            Swal.fire({
                title: 'Emergency Access Granted',
                text: 'You have emergency access to the system. Please resolve the subscription issue.',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
        } else {
            Swal.fire({
                title: 'Access Denied',
                text: 'Invalid emergency access code.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    showPaymentOptions() {
        Swal.fire({
            title: 'Payment Required',
            text: 'Please visit the subscription page to make payment.',
            icon: 'info',
            confirmButtonText: 'Go to Subscription',
            showCancelButton: true,
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.goToSubscription();
            }
        });
    }

    redirectToLogin() {
        if (window.location.pathname !== '/user-signin.html') {
            window.location.href = 'user-signin.html';
        }
    }

    // Public methods
    isAccessBlocked() {
        return !!document.getElementById('access-blocker');
    }

    forceAccessCheck() {
        this.checkAccess();
    }
}

// Initialize access control when DOM is loaded
let accessControl;
document.addEventListener('DOMContentLoaded', () => {
    accessControl = new AccessControl();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessControl;
}
