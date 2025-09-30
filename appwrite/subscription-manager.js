class SubscriptionManager {
  constructor() {
    this.subscriptionData = null;
    this.countdownInterval = null;
    this.paymentCheckInterval = null;
    this.init();
  }

  async init() {
    // Show loading modal
    this.showLoadingModal();

    await this.loadSubscriptionData();
    this.setupEventListeners();
    this.startCountdown();
    this.startPaymentCheck();
    this.checkAccessControl();

    // Hide loading modal after initialization
    this.hideLoadingModal();
  }

  async loadSubscriptionData() {
    try {
      // Load from localStorage or initialize default data
      const stored = localStorage.getItem("subscriptionData");
      if (stored) {
        this.subscriptionData = JSON.parse(stored);
      } else {
        // Initialize with free trial for new users
        this.subscriptionData = this.initializeFreeTrial();
      }

      // Check if subscription is expired
      this.checkSubscriptionStatus();
      this.saveSubscriptionData();
    } catch (error) {
      console.error("Error loading subscription data:", error);
      this.subscriptionData = this.initializeFreeTrial();
    }
  }

  initializeFreeTrial() {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days

    return {
      status: "free_trial",
      plan: "free",
      trialStart: now.toISOString(),
      trialEnd: trialEnd.toISOString(),
      planStart: null,
      planEnd: null,
      amountOwing: 0,
      lastPaymentCheck: now.toISOString(),
      paymentDueDate: null,
      isBlocked: false,
      blockedAt: null,
      paymentHistory: [],
    };
  }

  checkSubscriptionStatus() {
    const now = new Date();

    // Check if free trial has expired
    if (this.subscriptionData.status === "free_trial") {
      if (now > new Date(this.subscriptionData.trialEnd)) {
        this.subscriptionData.status = "trial_expired";
        this.showTrialExpiredPopup();
      }
    }

    // Check if plan has expired
    if (
      this.subscriptionData.planEnd &&
      now > new Date(this.subscriptionData.planEnd)
    ) {
      this.subscriptionData.status = "expired";
      if (!this.subscriptionData.isBlocked) {
        // Only set block time on transition
        this.subscriptionData.blockedAt = new Date().toISOString();
      }
      this.subscriptionData.isBlocked = true;
    }

    // Check if payment is overdue
    if (
      this.subscriptionData.paymentDueDate &&
      now > new Date(this.subscriptionData.paymentDueDate)
    ) {
      if (!this.subscriptionData.isBlocked) {
        // Only set block time on transition
        this.subscriptionData.blockedAt = new Date().toISOString();
      }
      this.subscriptionData.isBlocked = true;
    }
  }

  showTrialExpiredPopup() {
    Swal.fire({
      title: "Free Trial Expired!",
      text: "Your 20-day free trial has ended. To continue using Phluowise, you need to activate the Basic Plan.",
      icon: "info",
      showCancelButton: false,
      confirmButtonText: "Activate Basic Plan",
      confirmButtonColor: "#3B82F6",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.activateBasicPlan();
      }
    });
  }

  activateBasicPlan() {
    const now = new Date();
    const planEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    this.subscriptionData.status = "active";
    this.subscriptionData.plan = "basic";
    this.subscriptionData.planStart = now.toISOString();
    this.subscriptionData.planEnd = planEnd.toISOString();
    this.subscriptionData.amountOwing = 0;
    this.subscriptionData.isBlocked = false;
    this.subscriptionData.blockedAt = null;

    this.saveSubscriptionData();
    this.updateUI();

    Swal.fire({
      title: "Basic Plan Activated!",
      text: "Your Basic Plan is now active. You can continue using Phluowise.",
      icon: "success",
      confirmButtonText: "Great!",
    });
  }

  checkAccessControl() {
    if (this.subscriptionData.isBlocked) {
      this.blockApp();
    } else {
      this.unblockApp();
    }
  }

  blockApp() {
    // Create blocking overlay
    if (!document.getElementById("subscription-blocker")) {
      const blocker = document.createElement("div");
      blocker.id = "subscription-blocker";
      blocker.innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div class="bg-zinc-800 rounded-3xl p-8 max-w-md mx-4 text-center">
                        <div class="text-red-400 text-6xl mb-4">
                            <i class="fas fa-lock"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white mb-4">Access Blocked</h2>
                        <p class="text-gray-300 mb-6">
                            ${
                              this.subscriptionData.status === "expired"
                                ? "Your subscription has expired. Please renew to continue."
                                : "Payment is overdue. Please complete payment to restore access."
                            }
                        </p>
                        
                        ${
                          this.subscriptionData.amountOwing > 0
                            ? `
                            <div class="bg-red-900/50 rounded-lg p-4 mb-6">
                                <div class="text-red-400 font-bold text-xl">Amount Owing: GH₵${this.subscriptionData.amountOwing}</div>
                                <div class="text-gray-400 text-sm mt-2">Payment due: <span class="text-red-400" id="payment-countdown">--:--:--</span></div>
                            </div>
                        `
                            : ""
                        }
                        
                        <div class="space-y-3">
                            <button onclick="subscriptionManager.makePayment()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition">
                                Make Payment
                            </button>
                            <button onclick="subscriptionManager.logout()" class="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            `;
      document.body.appendChild(blocker);

      // Start countdown for payment if applicable
      if (this.subscriptionData.amountOwing > 0) {
        this.startPaymentCountdown();
      }
    }
  }

  unblockApp() {
    const blocker = document.getElementById("subscription-blocker");
    if (blocker) {
      blocker.remove();
    }
  }

  startPaymentCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      if (this.subscriptionData.paymentDueDate) {
        const now = new Date();
        const dueDate = new Date(this.subscriptionData.paymentDueDate);
        const timeLeft = dueDate - now;

        if (timeLeft <= 0) {
          // Payment deadline passed, keep app blocked
          clearInterval(this.countdownInterval);
          return;
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        const countdownElement = document.getElementById("payment-countdown");
        if (countdownElement) {
          countdownElement.textContent = `${hours
            .toString()
            .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
        }
      }
    }, 1000);
  }

  startCountdown() {
    // Update trial/plan countdown
    setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    const now = new Date();
    let targetDate;
    let countdownElement;

    if (this.subscriptionData.status === "free_trial") {
      targetDate = new Date(this.subscriptionData.trialEnd);
      countdownElement = document.getElementById("trial-countdown");
    } else if (this.subscriptionData.status === "active") {
      targetDate = new Date(this.subscriptionData.planEnd);
      countdownElement = document.getElementById("plan-countdown");
    }

    if (targetDate && countdownElement) {
      const timeLeft = targetDate - now;

      if (timeLeft <= 0) {
        countdownElement.textContent = "Expired";
        return;
      }

      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      if (days > 0) {
        countdownElement.textContent = `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;
      } else {
        countdownElement.textContent = `${hours}h : ${minutes}m : ${seconds}s`;
      }
    }
  }

  startPaymentCheck() {
    // Check payment status every 3 hours
    this.paymentCheckInterval = setInterval(() => {
      this.checkPaymentStatus();
    }, 3 * 60 * 60 * 1000); // 3 hours
  }

  async checkPaymentStatus() {
    try {
      // Simulate API call to check payment status
      // In real implementation, this would call your backend
      const response = await this.checkPaymentAPI();

      if (response.paymentCompleted) {
        this.subscriptionData.isBlocked = false;
        this.subscriptionData.blockedAt = null; // Clear blockedAt on successful payment
        this.subscriptionData.amountOwing = 0;
        this.subscriptionData.paymentDueDate = null;
        this.saveSubscriptionData();
        this.checkAccessControl();

        Swal.fire({
          title: "Payment Confirmed!",
          text: "Your payment has been processed. Access restored.",
          icon: "success",
          confirmButtonText: "Great!",
        });
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  }

  async checkPaymentAPI() {
    // Simulate API call - replace with actual implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ paymentCompleted: false });
      }, 1000);
    });
  }

  async makePayment() {
    try {
      // Show payment method selection
      const { value: paymentMethod } = await Swal.fire({
        title: "Select Payment Method",
        input: "select",
        inputOptions: {
          mtn: "MTN Mobile Money",
          vodafone: "Vodafone Cash",
          airteltigo: "AirtelTigo Money",
        },
        inputPlaceholder: "Choose payment method",
        showCancelButton: true,
        confirmButtonText: "Proceed to Payment",
        cancelButtonText: "Cancel",
      });

      if (paymentMethod) {
        // Simulate payment processing
        Swal.fire({
          title: "Processing Payment...",
          text: "Please wait while we process your payment.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Simulate payment delay
        setTimeout(() => {
          Swal.fire({
            title: "Payment Successful!",
            text: "Your payment has been processed successfully.",
            icon: "success",
            confirmButtonText: "Continue",
          }).then(() => {
            // Update subscription data
            this.subscriptionData.isBlocked = false;
            this.subscriptionData.blockedAt = null; // Clear blockedAt on successful payment
            this.subscriptionData.amountOwing = 0;
            this.subscriptionData.paymentDueDate = null;
            this.subscriptionData.status = "active";

            // Extend plan
            const now = new Date();
            const planEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            this.subscriptionData.planEnd = planEnd.toISOString();

            this.saveSubscriptionData();
            this.checkAccessControl();
            this.updateUI();
          });
        }, 3000);
      }
    } catch (error) {
      console.error("Payment error:", error);
    }
  }

  logout() {
    // Clear subscription data and redirect to login
    localStorage.removeItem("subscriptionData");
    localStorage.removeItem("isLoggedIn");

    // Redirect to login page
    window.location.href = "user-signin.html";
  }

  // Method to simulate login for demo purposes
  simulateLogin() {
    localStorage.setItem("isLoggedIn", "true");
    console.log("Demo login simulated");
  }

  setupEventListeners() {
    // Activate Basic Plan button
    document.addEventListener("click", (e) => {
      if (e.target.textContent === "Activate Plan") {
        this.activateBasicPlan();
      }
    });
  }

  updateUI() {
    // Update subscription status display
    const statusElement = document.getElementById("subscription-status");
    if (statusElement) {
      statusElement.textContent = this.subscriptionData.status
        .replace("_", " ")
        .toUpperCase();
    }

    // Update plan information
    this.updatePlanDisplay();
  }

  updatePlanDisplay() {
    // Update plan details based on current status
    const planCards = document.querySelectorAll(".plan-card");

    planCards.forEach((card) => {
      const planType = card.getAttribute("data-plan");
      const activateBtn = card.querySelector(".activate-btn");

      if (
        planType === this.subscriptionData.plan &&
        this.subscriptionData.status === "active"
      ) {
        card.classList.add("active-plan");
        if (activateBtn) {
          activateBtn.textContent = "Current Plan";
          activateBtn.disabled = true;
          activateBtn.classList.add("bg-gray-500", "cursor-not-allowed");
        }
      } else {
        card.classList.remove("active-plan");
        if (activateBtn) {
          activateBtn.textContent = "Activate Plan";
          activateBtn.disabled = false;
          activateBtn.classList.remove("bg-gray-500", "cursor-not-allowed");
        }
      }
    });
  }

  saveSubscriptionData() {
    localStorage.setItem(
      "subscriptionData",
      JSON.stringify(this.subscriptionData)
    );
  }

  // Public methods for external access
  getSubscriptionStatus() {
    return this.subscriptionData.status;
  }

  isAppBlocked() {
    return this.subscriptionData.isBlocked;
  }

  getAmountOwing() {
    return this.subscriptionData.amountOwing;
  }

  getTimeRemaining() {
    if (this.subscriptionData.status === "free_trial") {
      return new Date(this.subscriptionData.trialEnd) - new Date();
    } else if (this.subscriptionData.status === "active") {
      return new Date(this.subscriptionData.planEnd) - new Date();
    }
    return 0;
  }

  // Loading modal helper functions
  showLoadingModal() {
    const modal = document.getElementById("loadingModal");
    if (modal) {
      modal.style.display = "flex";
      modal.classList.remove("fade-out");
    }
  }

  hideLoadingModal() {
    const modal = document.getElementById("loadingModal");
    if (modal) {
      modal.classList.add("fade-out");
      setTimeout(() => {
        modal.style.display = "none";
      }, 500);
    }
  }
}

// Initialize subscription manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.subscriptionManager = new SubscriptionManager();
});

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = SubscriptionManager;
}
