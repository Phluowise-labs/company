/**
 * Subscription System Demo Script
 * This script provides functions to test different subscription scenarios
 * for development and demonstration purposes
 */

class SubscriptionDemo {
    constructor() {
        this.subscriptionManager = null;
        this.init();
    }

    async init() {
        await this.waitForSubscriptionManager();
        this.createDemoPanel();
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
        });
    }

    createDemoPanel() {
        // Create demo panel
        const demoPanel = document.createElement('div');
        demoPanel.id = 'subscription-demo-panel';
        demoPanel.innerHTML = `
            <div class="fixed bottom-4 right-4 bg-zinc-800 rounded-2xl p-4 shadow-2xl z-[9998] max-w-sm">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-white font-semibold text-sm">Subscription Demo</h3>
                    <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-2 text-xs">
                    <div class="text-gray-300">Current Status: <span id="demo-status" class="font-medium">Loading...</span></div>
                    <div class="text-gray-300">Plan: <span id="demo-plan" class="font-medium">Loading...</span></div>
                    <div class="text-gray-300">Amount Owing: <span id="demo-amount" class="font-medium">Loading...</span></div>
                </div>
                
                <div class="mt-3 space-y-2">
                    <button onclick="subscriptionDemo.setFreeTrial()" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-xs transition">
                        Set Free Trial
                    </button>
                    <button onclick="subscriptionDemo.setBasicPlan()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs transition">
                        Set Basic Plan
                    </button>
                    <button onclick="subscriptionDemo.setExpiredPlan()" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-xs transition">
                        Set Expired Plan
                    </button>
                    <button onclick="subscriptionDemo.setPaymentDue()" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded-lg text-xs transition">
                        Set Payment Due
                    </button>
                    <button onclick="subscriptionDemo.setTrulyOverdue()" class="w-full bg-red-700 hover:bg-red-800 text-white py-2 px-3 rounded-lg text-xs transition">
                        Set Truly Overdue
                    </button>
                    <button onclick="subscriptionDemo.resetSubscription()" class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-xs transition">
                        Reset
                    </button>
                </div>
                
                <div class="mt-3 text-xs text-gray-500">
                    <p>Use these buttons to test different subscription states</p>
                </div>
            </div>
        `;

        document.body.appendChild(demoPanel);
        this.updateDemoDisplay();
    }

    updateDemoDisplay() {
        if (!this.subscriptionManager || !this.subscriptionManager.subscriptionData) return;

        const data = this.subscriptionManager.subscriptionData;
        
        const statusElement = document.getElementById('demo-status');
        const planElement = document.getElementById('demo-plan');
        const amountElement = document.getElementById('demo-amount');

        if (statusElement) statusElement.textContent = data.status.replace('_', ' ').toUpperCase();
        if (planElement) planElement.textContent = data.plan.charAt(0).toUpperCase() + data.plan.slice(1);
        if (amountElement) amountElement.textContent = `GH₵ ${data.amountOwing.toFixed(2)}`;
    }

    // Demo functions
    setFreeTrial() {
        if (!this.subscriptionManager) return;

        const now = new Date();
        const trialEnd = new Date(now.getTime() + (20 * 24 * 60 * 60 * 1000)); // 20 days

        this.subscriptionManager.subscriptionData = {
            status: 'free_trial',
            plan: 'free',
            trialStart: now.toISOString(),
            trialEnd: trialEnd.toISOString(),
            planStart: null,
            planEnd: null,
            amountOwing: 0,
            lastPaymentCheck: now.toISOString(),
            paymentDueDate: null,
            isBlocked: false,
            paymentHistory: []
        };

        this.subscriptionManager.saveSubscriptionData();
        this.subscriptionManager.checkAccessControl();
        this.updateDemoDisplay();
        
        Swal.fire({
            title: 'Demo: Free Trial Set',
            text: 'Subscription set to 20-day free trial',
            icon: 'info',
            confirmButtonText: 'OK'
        });
    }

    setBasicPlan() {
        if (!this.subscriptionManager) return;

        const now = new Date();
        const planEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

        this.subscriptionManager.subscriptionData = {
            status: 'active',
            plan: 'basic',
            trialStart: null,
            trialEnd: null,
            planStart: now.toISOString(),
            planEnd: planEnd.toISOString(),
            amountOwing: 0,
            lastPaymentCheck: now.toISOString(),
            paymentDueDate: null,
            isBlocked: false,
            paymentHistory: []
        };

        this.subscriptionManager.saveSubscriptionData();
        this.subscriptionManager.checkAccessControl();
        this.updateDemoDisplay();
        
        Swal.fire({
            title: 'Demo: Basic Plan Set',
            text: 'Subscription set to active Basic Plan',
            icon: 'success',
            confirmButtonText: 'OK'
        });
    }

    setExpiredPlan() {
        if (!this.subscriptionManager) return;

        const now = new Date();
        const planEnd = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)); // 1 day ago

        this.subscriptionManager.subscriptionData = {
            status: 'expired',
            plan: 'basic',
            trialStart: null,
            trialEnd: null,
            planStart: new Date(now.getTime() - (31 * 24 * 60 * 60 * 1000)).toISOString(),
            planEnd: planEnd.toISOString(),
            amountOwing: 0,
            lastPaymentCheck: now.toISOString(),
            paymentDueDate: null,
            isBlocked: true,
            blockedAt: now.toISOString(),
            paymentHistory: []
        };

        this.subscriptionManager.saveSubscriptionData();
        this.subscriptionManager.checkAccessControl();
        this.updateDemoDisplay();
        
        Swal.fire({
            title: 'Demo: Expired Plan Set',
            text: 'Subscription set to expired - app should be blocked',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }

    setPaymentDue() {
        if (!this.subscriptionManager) return;

        const now = new Date();
        const paymentDue = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours in future

        this.subscriptionManager.subscriptionData = {
            status: 'active',
            plan: 'basic',
            trialStart: null,
            trialEnd: null,
            planStart: new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)).toISOString(),
            planEnd: new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)).toISOString(),
            amountOwing: 150.00,
            lastPaymentCheck: now.toISOString(),
            paymentDueDate: paymentDue.toISOString(),
            isBlocked: false, // Not blocked yet
            paymentHistory: []
        };

        this.subscriptionManager.saveSubscriptionData();
        this.subscriptionManager.checkAccessControl();
        this.updateDemoDisplay();
        
        Swal.fire({
            title: 'Demo: Payment Due Set',
            text: 'Payment due in 2 hours - you can see the countdown',
            icon: 'info',
            confirmButtonText: 'OK'
        });
    }

    setTrulyOverdue() {
        if (!this.subscriptionManager) return;

        const now = new Date();
        const paymentDue = new Date(now.getTime() - (2 * 60 * 60 * 1000)); // 2 hours ago

        this.subscriptionManager.subscriptionData = {
            status: 'active',
            plan: 'basic',
            trialStart: null,
            trialEnd: null,
            planStart: new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)).toISOString(),
            planEnd: new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)).toISOString(),
            amountOwing: 150.00,
            lastPaymentCheck: now.toISOString(),
            paymentDueDate: paymentDue.toISOString(),
            isBlocked: true,
            blockedAt: now.toISOString(),
            paymentHistory: []
        };

        this.subscriptionManager.saveSubscriptionData();
        this.subscriptionManager.checkAccessControl();
        this.updateDemoDisplay();
        
        Swal.fire({
            title: 'Demo: Truly Overdue Payment Set',
            text: 'Payment overdue by 2 hours - app should be blocked',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }

    resetSubscription() {
        if (!this.subscriptionManager) return;

        // Clear subscription data
        localStorage.removeItem('subscriptionData');
        
        // Reload page to reinitialize
        window.location.reload();
    }

    // Public methods
    showDemoPanel() {
        const existingPanel = document.getElementById('subscription-demo-panel');
        if (!existingPanel) {
            this.createDemoPanel();
        }
    }

    hideDemoPanel() {
        const panel = document.getElementById('subscription-demo-panel');
        if (panel) {
            panel.remove();
        }
    }
}

// Initialize demo when DOM is loaded
let subscriptionDemo;
document.addEventListener('DOMContentLoaded', () => {
    // Only show demo in development/testing environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(() => {
            subscriptionDemo = new SubscriptionDemo();
        }, 2000); // Wait for subscription manager to initialize
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionDemo;
}
