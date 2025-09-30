// Enhanced Subscription Manager with Appwrite Integration
import { databases, DB_ID, account } from './js/config.js';
import PaymentProcessor from './payment-integration.js';

class SubscriptionManager {
  constructor() {
    this.subscriptionData = null;
    this.companyId = null;
    this.countdownInterval = null;
    this.paymentCheckInterval = null;
    this.paymentProcessor = new PaymentProcessor();
    this.init();
  }

  async init() {
    try {
      // Show loading modal
      this.showLoadingModal();

      // Get current user/company
      await this.getCurrentUser();
      
      // Load subscription data from Appwrite
      await this.loadSubscriptionData();
      
      // Setup UI and intervals
      this.setupEventListeners();
      this.startCountdown();
      this.startPaymentCheck();
      
      // Check access control
      this.checkAccessControl();

      // Hide loading modal
      this.hideLoadingModal();
      
    } catch (error) {
      console.error('Error initializing subscription manager:', error);
      this.hideLoadingModal();
      this.handleInitializationError(error);
    }
  }

  async getCurrentUser() {
    try {
      // Get current user session
      const user = await account.get();
      
      // For now, use a demo company ID - in production, get from user profile
      this.companyId = localStorage.getItem('company_id') || 'demo_company_001';
      
      console.log('Current company ID:', this.companyId);
    } catch (error) {
      console.error('Error getting current user:', error);
      // Use demo company for testing
      this.companyId = 'demo_company_001';
    }
  }

  async loadSubscriptionData() {
    try {
      // Try to get existing subscription from Appwrite
      const response = await databases.listDocuments(
        DB_ID,
        'subscriptions',
        [
          databases.Query.equal('company_id', this.companyId)
        ]
      );

      if (response.documents.length > 0) {
        // Use existing subscription
        this.subscriptionData = response.documents[0];
        console.log('Loaded existing subscription:', this.subscriptionData);
      } else {
        // Create new free trial subscription
        this.subscriptionData = await this.createFreeTrial();
        console.log('Created new free trial:', this.subscriptionData);
      }

      // Check and update subscription status
      await this.checkSubscriptionStatus();
      
    } catch (error) {
      console.error('Error loading subscription data:', error);
      // Fallback to localStorage for testing
      this.loadFromLocalStorage();
    }
  }

  async createFreeTrial() {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days
    
    const subscriptionData = {
      subscription_id: this.generateId(),
      company_id: this.companyId,
      plan_type: 'free_trial',
      status: 'active',
      start_date: now.toISOString(),
      end_date: trialEnd.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      is_blocked: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    try {
      const response = await databases.createDocument(
        DB_ID,
        'subscriptions',
        subscriptionData.subscription_id,
        subscriptionData
      );
      return response;
    } catch (error) {
      console.error('Error creating free trial:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus() {
    const now = new Date();
    let needsUpdate = false;
    const updates = {};

    // Check if subscription has expired
    if (now > new Date(this.subscriptionData.end_date)) {
      if (this.subscriptionData.status !== 'expired') {
        updates.status = 'expired';
        updates.is_blocked = true;
        updates.blocked_at = now.toISOString();
        
        // Set payment due date (7 days grace period)
        const gracePeriod = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updates.payment_due_date = gracePeriod.toISOString();
        updates.grace_period_end = gracePeriod.toISOString();
        
        // Set amount due based on plan type
        updates.amount_due = this.getPlanPrice(this.subscriptionData.plan_type);
        
        needsUpdate = true;
        this.showSubscriptionExpiredPopup();
      }
    }

    // Check if payment is overdue (grace period expired)
    if (this.subscriptionData.payment_due_date && 
        now > new Date(this.subscriptionData.payment_due_date)) {
      if (this.subscriptionData.status !== 'payment_overdue') {
        updates.status = 'payment_overdue';
        updates.is_blocked = true;
        needsUpdate = true;
      }
    }

    // Update subscription if needed
    if (needsUpdate) {
      updates.updated_at = now.toISOString();
      await this.updateSubscription(updates);
    }
  }

  async updateSubscription(updates) {
    try {
      const response = await databases.updateDocument(
        DB_ID,
        'subscriptions',
        this.subscriptionData.$id,
        updates
      );
      
      // Update local data
      Object.assign(this.subscriptionData, updates);
      console.log('Subscription updated:', updates);
      
      return response;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  getPlanPrice(planType) {
    const prices = {
      'free_trial': 29.99,
      'basic': 29.99,
      'premium': 59.99,
      'enterprise': 99.99
    };
    return prices[planType] || 29.99;
  }

  showSubscriptionExpiredPopup() {
    if (this.subscriptionData.plan_type === 'free_trial') {
      this.showTrialExpiredPopup();
    } else {
      this.showPlanExpiredPopup();
    }
  }

  async showTrialExpiredPopup() {
    const { value: action } = await Swal.fire({
      title: 'Free Trial Expired',
      html: `
        <div class="text-center space-y-4">
          <div class="bg-yellow-900 bg-opacity-50 rounded-lg p-4 mb-4">
            <i class="fas fa-clock text-yellow-400 text-3xl mb-2"></i>
            <div class="text-lg font-semibold text-white">Your free trial has ended</div>
            <div class="text-sm text-gray-300 mt-2">Continue with a paid subscription to keep using the app</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="text-sm text-gray-400">Basic Plan</div>
            <div class="text-2xl font-bold text-blue-400">$29.99/month</div>
            <div class="text-xs text-gray-500 mt-1">Full access to all features</div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Subscribe Now',
      cancelButtonText: 'Later',
      confirmButtonColor: '#F59E0B',
      background: '#1F2937',
      color: '#F9FAFB',
      allowOutsideClick: false
    });

    if (action) {
      await this.paymentProcessor.showPaymentModal(this.subscriptionData);
    }
  }

  async showPlanExpiredPopup() {
    const { value: action } = await Swal.fire({
      title: 'Subscription Expired',
      html: `
        <div class="text-center space-y-4">
          <div class="bg-orange-900 bg-opacity-50 rounded-lg p-4 mb-4">
            <i class="fas fa-calendar-times text-orange-400 text-3xl mb-2"></i>
            <div class="text-lg font-semibold text-white">Your subscription has expired</div>
            <div class="text-sm text-gray-300 mt-2">Renew your subscription to continue using the app</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-4">
            <div class="text-sm text-gray-400">Renew ${this.subscriptionData.plan_type} Plan</div>
            <div class="text-2xl font-bold text-blue-400">$${this.getPlanPrice(this.subscriptionData.plan_type)}/month</div>
            <div class="text-xs text-gray-500 mt-1">Continue with your current plan</div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Renew Now',
      cancelButtonText: 'Later',
      confirmButtonColor: '#F97316',
      background: '#1F2937',
      color: '#F9FAFB',
      allowOutsideClick: false
    });

    if (action) {
      await this.paymentProcessor.showPaymentModal(this.subscriptionData);
    }
  }

  showUpgradeOptions() {
    // Show subscription plans modal
    const modal = document.getElementById('subscription-plans-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  checkAccessControl() {
    if (this.subscriptionData.is_blocked) {
      this.blockApp();
    } else {
      this.unblockApp();
    }
  }

  blockApp() {
    // Remove existing blocker first
    const existingBlocker = document.getElementById('subscription-blocker');
    if (existingBlocker) {
      existingBlocker.remove();
    }

    // Create subscription blocker overlay
    const blocker = document.createElement('div');
    blocker.id = 'subscription-blocker';
    blocker.className = 'fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center';
    
    const reason = this.getBlockReason();
    
    blocker.innerHTML = `
      <div class="bg-zinc-900 rounded-3xl p-8 max-w-md mx-4 text-center border border-zinc-700">
        <div class="text-red-400 text-6xl mb-4">
          <i class="fas fa-lock"></i>
        </div>
        <h2 class="text-2xl font-bold text-white mb-4">${reason.title}</h2>
        <p class="text-gray-300 mb-6">${reason.message}</p>
        
        ${this.subscriptionData.amount_due ? `
          <div class="bg-zinc-800 rounded-2xl p-4 mb-6">
            <div class="text-gray-400 text-sm">Amount Due</div>
            <div class="text-2xl font-bold text-red-400">$${this.subscriptionData.amount_due}</div>
          </div>
        ` : ''}
        
        <div class="space-y-3">
          <button onclick="subscriptionManager.makePayment()" 
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition">
            ${this.subscriptionData.plan_type === 'free_trial' ? 'Upgrade Now' : 'Make Payment'}
          </button>
          <button onclick="subscriptionManager.logout()" 
                  class="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition">
            Logout
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(blocker);
  }

  getBlockReason() {
    if (this.subscriptionData.status === 'expired' && this.subscriptionData.plan_type === 'free_trial') {
      return {
        title: 'Free Trial Expired',
        message: 'Your 20-day free trial has ended. Upgrade to a paid plan to continue using Phluowise.'
      };
    } else if (this.subscriptionData.status === 'expired') {
      return {
        title: 'Subscription Expired',
        message: `Your ${this.subscriptionData.plan_type} plan has expired. Renew your subscription to continue.`
      };
    } else if (this.subscriptionData.status === 'payment_overdue') {
      return {
        title: 'Payment Overdue',
        message: 'Your payment is overdue. Please make a payment to restore access.'
      };
    } else {
      return {
        title: 'Access Blocked',
        message: 'Your account access has been temporarily blocked.'
      };
    }
  }

  unblockApp() {
    const blocker = document.getElementById('subscription-blocker');
    if (blocker) {
      blocker.remove();
    }
  }

  async makePayment() {
    try {
      // Use payment processor to handle payment
      await this.paymentProcessor.showPaymentModal(this.subscriptionData);

      // Update subscription after successful payment
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const updates = {
        status: 'active',
        is_blocked: false,
        blocked_at: null,
        last_payment_date: now.toISOString(),
        end_date: nextMonth.toISOString(),
        payment_due_date: null,
        grace_period_end: null,
        amount_due: null,
        updated_at: now.toISOString()
      };

      // If upgrading from trial, change plan type
      if (this.subscriptionData.plan_type === 'free_trial') {
        updates.plan_type = 'basic';
      }

      await this.updateSubscription(updates);

      // Show success message
      Swal.fire({
        title: 'Payment Successful!',
        text: 'Your subscription has been activated. Welcome back!',
        icon: 'success',
        confirmButtonColor: '#10B981',
        background: '#1F2937',
        color: '#F9FAFB'
      });

      // Unblock app and update UI
      this.unblockApp();
      this.updateUI();

    } catch (error) {
      console.error('Payment error:', error);
      Swal.fire({
        title: 'Payment Failed',
        text: 'There was an error processing your payment. Please try again.',
        icon: 'error',
        confirmButtonColor: '#EF4444',
        background: '#1F2937',
        color: '#F9FAFB'
      });
    }
  }

  startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    const now = new Date();
    const endDate = new Date(this.subscriptionData.end_date);
    const timeLeft = endDate - now;

    const countdownElement = document.getElementById('subscription-countdown');
    if (countdownElement) {
      if (timeLeft <= 0) {
        countdownElement.textContent = 'Expired';
        countdownElement.className = 'text-2xl font-bold countdown-timer text-red-400';
      } else {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        if (days > 0) {
          countdownElement.textContent = `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;
        } else {
          countdownElement.textContent = `${hours}h : ${minutes}m : ${seconds}s`;
        }
        
        // Color based on time remaining
        if (days <= 3) {
          countdownElement.className = 'text-2xl font-bold countdown-timer text-red-400';
        } else if (days <= 7) {
          countdownElement.className = 'text-2xl font-bold countdown-timer text-yellow-400';
        } else {
          countdownElement.className = 'text-2xl font-bold countdown-timer text-blue-400';
        }
      }
    }
  }

  startPaymentCheck() {
    // Check subscription status every hour
    this.paymentCheckInterval = setInterval(() => {
      this.checkSubscriptionStatus();
    }, 60 * 60 * 1000); // 1 hour
  }

  updateUI() {
    // Update status display
    const statusElement = document.getElementById('subscription-status');
    if (statusElement) {
      statusElement.textContent = this.getStatusText();
      statusElement.className = `subscription-status ${this.getStatusClass()}`;
    }

    // Update plan display
    const planElement = document.getElementById('subscription-plan');
    if (planElement) {
      planElement.textContent = this.getPlanText();
    }

    // Update amount display
    const amountElement = document.getElementById('amount-owing');
    if (amountElement) {
      if (this.subscriptionData.amount_due) {
        amountElement.textContent = `$${this.subscriptionData.amount_due}`;
        amountElement.className = 'text-xl font-bold text-red-400';
      } else {
        amountElement.textContent = '$0.00';
        amountElement.className = 'text-xl font-bold text-green-400';
      }
    }
  }

  getStatusText() {
    const statusMap = {
      'active': 'Active',
      'expired': 'Expired',
      'payment_overdue': 'Payment Overdue',
      'blocked': 'Blocked'
    };
    return statusMap[this.subscriptionData.status] || 'Unknown';
  }

  getStatusClass() {
        const classMap = {
            'free_trial': 'status-free-trial',
            'active': 'status-active',
            'expired': 'status-expired',
            'trial_expired': 'status-trial-expired',
            'payment_overdue': 'status-expired',
            'blocked': 'status-expired'
        };
        return classMap[this.subscription.status] || 'status-expired';
    }

  getPlanText() {
    const planMap = {
      'free_trial': 'Free Trial',
      'basic': 'Basic Plan',
      'premium': 'Premium Plan',
      'enterprise': 'Enterprise Plan'
    };
    return planMap[this.subscriptionData.plan_type] || 'Unknown Plan';
  }

  // Utility methods
  generateId() {
    return 'sub_' + Math.random().toString(36).substr(2, 16);
  }

  loadFromLocalStorage() {
    // Fallback to localStorage for testing
    const stored = localStorage.getItem("subscriptionData");
    if (stored) {
      this.subscriptionData = JSON.parse(stored);
    } else {
      this.subscriptionData = this.initializeLocalFreeTrial();
    }
  }

  initializeLocalFreeTrial() {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

    return {
      subscription_id: this.generateId(),
      company_id: this.companyId,
      plan_type: 'free_trial',
      status: 'active',
      start_date: now.toISOString(),
      end_date: trialEnd.toISOString(),
      is_blocked: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
  }

  setupEventListeners() {
    // Add event listeners for UI interactions
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="upgrade"]')) {
        this.showUpgradeOptions();
      } else if (e.target.matches('[data-action="make-payment"]')) {
        this.makePayment();
      }
    });
  }

  logout() {
    localStorage.clear();
    window.location.href = 'signin.html';
  }

  showLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
      modal.classList.add('fade-out');
      setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('fade-out');
      }, 500);
    }
  }

  handleInitializationError(error) {
    console.error('Subscription manager initialization failed:', error);
    // Show error message to user
    Swal.fire({
      title: 'Connection Error',
      text: 'Unable to load subscription data. Please refresh the page.',
      icon: 'error',
      confirmButtonText: 'Refresh',
      background: '#1F2937',
      color: '#F9FAFB'
    }).then(() => {
      window.location.reload();
    });
  }

  // Public API methods
  getSubscriptionStatus() {
    return this.subscriptionData?.status || 'unknown';
  }

  isAppBlocked() {
    return this.subscriptionData?.is_blocked || false;
  }

  getTimeRemaining() {
    if (!this.subscriptionData?.end_date) return 0;
    return new Date(this.subscriptionData.end_date) - new Date();
  }
}

// Initialize subscription manager
let subscriptionManager;

document.addEventListener("DOMContentLoaded", () => {
  subscriptionManager = new SubscriptionManager();
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = SubscriptionManager;
}

// Make available globally
window.subscriptionManager = subscriptionManager;