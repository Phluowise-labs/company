// =============================
// Account Page Manager
// =============================

// Appwrite configuration (inline like driver.js)
const ACCOUNT_APPWRITE_ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
const ACCOUNT_APPWRITE_PROJECT = "68b17582003582da69c8";
const ACCOUNT_DB_ID = "68b1b7590035346a3be9";
const ACCOUNT_ORDERS_COLL = "orders";
const ACCOUNT_CUSTOMERS_COLL = "customer_tb";

// Initialize Appwrite client (using global Appwrite from CDN)
const accountClient = new Appwrite.Client()
  .setEndpoint(ACCOUNT_APPWRITE_ENDPOINT)
  .setProject(ACCOUNT_APPWRITE_PROJECT);

const accountService = new Appwrite.Account(accountClient);
const accountDatabases = new Appwrite.Databases(accountClient);

// Use AccountMetrics class (no import needed since it's loaded as regular script)

class AccountManager {
  constructor() {
    this.accountMetrics = new AccountMetrics();
    this.transactionChart = null;
    this.currentUser = null;
    this.userRole = null;
    this.companyId = null;
    this.branchId = null;
  }

  /**
   * Initialize the account page
   */
  async init() {
    try {
      // Show loading modal
      this.showLoadingModal();

      // Check authentication using Appwrite account directly
      this.currentUser = await accountService.get();
      if (!this.currentUser) {
        window.location.href = "signin.html";
        return;
      }

      // Get user role and IDs from localStorage (set by AuthManager)
      await this.loadUserContext();

      // Initialize page components
      await this.loadDashboardMetrics();
      await this.loadTransactionChart();
      await this.loadUserGrid();

      // Setup event listeners
      this.setupEventListeners();

      // Hide loading modal once everything is loaded
      this.hideLoadingModal();

      console.log("Account page initialized successfully");
    } catch (error) {
      console.error("Error initializing account page:", error);
      this.hideLoadingModal();
      this.showError("Failed to load account data. Please refresh the page.");
    }
  }

  /**
   * Load user context (role, company, branch)
   */
  async loadUserContext() {
    try {
      // Get from localStorage (set by AuthManager)
      this.userRole = localStorage.getItem("activeRole") || "admin";
      this.companyId =
        localStorage.getItem("companyId") || this.currentUser.$id;
      this.branchId = null; // Can be extended later if needed

      console.log("User context loaded:", {
        role: this.userRole,
        companyId: this.companyId,
        branchId: this.branchId,
      });
    } catch (error) {
      console.error("Error loading user context:", error);
      // Fallback to default values
      this.userRole = "admin";
      this.companyId = this.currentUser.$id;
      this.branchId = null;
    }
  }

  /**
   * Load and display dashboard metrics
   */
  async loadDashboardMetrics() {
    try {
      const metrics = await this.accountMetrics.calculateDashboardMetrics(
        this.companyId,
        this.branchId
      );

      // Update dashboard cards
      this.updateDashboardCard(
        "total-amount",
        metrics.totalRevenue,
        "Total Transaction Amount"
      );
      this.updateDashboardCard(
        "transaction-growth",
        metrics.revenueGrowth,
        "Transaction Growth"
      );
      this.updateDashboardCard(
        "orders-count",
        metrics.totalOrders,
        "Booked Orders"
      );
      this.updateDashboardCard(
        "orders-growth",
        metrics.ordersGrowth,
        "Orders Growth"
      );
      this.updateDashboardCard(
        "requests-count",
        metrics.totalRequests,
        "Total Requests"
      );

      // Update total payments
      const totalPaymentsElement = document.getElementById("total-payments");
      if (totalPaymentsElement) {
        // Remove loading skeleton and set actual value
        const loadingSkeleton = totalPaymentsElement.querySelector(
          ".loading-skeleton, .loading-skeleton-small"
        );
        if (loadingSkeleton) {
          loadingSkeleton.remove();
        }
        totalPaymentsElement.textContent = `$${metrics.totalPayments}`;
      }
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
      this.showError("Failed to load dashboard metrics");
    }
  }

  /**
   * Update a dashboard card
   */
  updateDashboardCard(elementId, value, label) {
    const element = document.getElementById(elementId);
    if (element) {
      // Remove loading skeleton and set actual value
      const loadingSkeleton = element.querySelector(
        ".loading-skeleton, .loading-skeleton-small"
      );
      if (loadingSkeleton) {
        loadingSkeleton.remove();
      }
      element.textContent =
        typeof value === "number" ? value.toLocaleString() : value;
    }
  }

  /**
   * Load and initialize transaction chart
   */
  async loadTransactionChart() {
    try {
      const transactionData = await this.accountMetrics.fetchTransactionData(
        this.companyId,
        this.branchId
      );

      this.populateYearSelector(transactionData);

      // Initialize chart with the most recent year's data
      const years = Object.keys(transactionData).sort((a, b) => b - a);
      if (years.length > 0) {
        this.updateChart(transactionData[years[0]], years[0]);
      }
    } catch (error) {
      console.error("Error loading transaction chart:", error);
      this.showError("Failed to load transaction chart");
    }
  }

  /**
   * Populate year selector dropdown
   */
  populateYearSelector(transactionData) {
    const yearSelector = document.getElementById("year-selector");
    if (!yearSelector) return;

    yearSelector.innerHTML = "";
    const years = Object.keys(transactionData).sort((a, b) => b - a);

    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelector.appendChild(option);
    });

    // Set up change event listener
    yearSelector.addEventListener("change", (e) => {
      const selectedYear = e.target.value;
      this.updateChart(transactionData[selectedYear], selectedYear);
    });
  }

  /**
   * Update the transaction chart
   */
  updateChart(yearData, year) {
    const canvas = document.getElementById("transactionChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Destroy existing chart if it exists
    if (this.transactionChart) {
      this.transactionChart.destroy();
    }

    const months = yearData.map((item) => item.month);
    const amounts = yearData.map((item) => item.amount);

    this.transactionChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: `Transactions ${year}`,
            data: amounts,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "$" + value.toLocaleString();
              },
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${
                  context.dataset.label
                }: $${context.parsed.y.toLocaleString()}`;
              },
            },
          },
        },
      },
    });

    // Update highlight value with total amount for the year
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const highlightValueElement = document.getElementById("highlight-value");
    if (highlightValueElement) {
      // Remove loading skeleton and set actual value
      const loadingSkeleton = highlightValueElement.querySelector(
        ".loading-skeleton, .loading-skeleton-small"
      );
      if (loadingSkeleton) {
        loadingSkeleton.remove();
      }
      highlightValueElement.textContent = `$${totalAmount.toLocaleString()}`;
    }
  }

  /**
   * Load user grid with customer data
   */
  async loadUserGrid() {
    try {
      const queries = [
        Appwrite.Query.limit(50),
        // Removed orderDesc('created_at') as customer_tb doesn't have this attribute
      ];

      const response = await accountDatabases.listDocuments(
        ACCOUNT_DB_ID,
        ACCOUNT_CUSTOMERS_COLL,
        queries
      );
      const customers = response.documents;

      this.createUserCards(customers);
      this.setupUserSearch(customers);
    } catch (error) {
      console.error("Error loading user grid:", error);
      this.createFallbackUserCards();
    }
  }

  /**
   * Create user cards from customer data
   */
  createUserCards(customers) {
    const userGrid = document.getElementById("userGrid");
    if (!userGrid) return;

    userGrid.innerHTML = "";

    customers.forEach((customer) => {
      const userCard = document.createElement("div");
      userCard.className = "user-card bg-[#212121] rounded-lg p-4 flex";
      userCard.innerHTML = `
                <div class="w-24 h-24 bg-zinc-800 rounded-md flex justify-center items-center">Image</div>
                <div class="ml-4 flex-grow gap-3 relative">
                    <h3 class="text-white text-lg">${
                      customer.name || customer.full_name
                    } </h3>
                    <p class="text-white mb-1">${
                      customer.location ||
                      customer.address ||
                      customer.city ||
                      "Unknown location"
                    }</p>
                    <div class="flex items-center text-gray-400 text-sm mb-4">
                        <span>12:30am</span>
                        <span class="ml-2">July 20, 2023</span>
                    </div>
                    <div class="absolute top-4 right-4 flex flex-col items-center">
                        <div class="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                            <img src="../images/location.svg" alt="" onerror="this.style.display='none'">
                        </div>
                        <p class="text-white text-xs mt-1">Visit</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="bg-gray-500 rounded-full px-4 py-1 text-white text-sm">
                            Accepted
                        </div>
                    </div>
                </div>
            `;
      userGrid.appendChild(userCard);
    });
  }

  /**
   * Create fallback user cards when data loading fails
   */
  createFallbackUserCards() {
    const userGrid = document.getElementById("userGrid");
    if (!userGrid) return;

    userGrid.innerHTML = `
      <div class="col-span-full text-center py-8">
        <div class="text-gray-400 mb-4">
          <i class="fas fa-users text-4xl"></i>
        </div>
        <h3 class="text-lg font-medium text-white mb-2">No Customer Data Available</h3>
        <p class="text-gray-400">Unable to load customer information at this time.</p>
      </div>
    `;
  }

  /**
   * Setup user search functionality
   */
  setupUserSearch(customers) {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      if (searchTerm.trim() === "") {
        this.createUserCards(customers);
      } else {
        const filteredCustomers = customers.filter(
          (customer) =>
            (customer.name || customer.full_name || "")
              .toLowerCase()
              .includes(searchTerm) ||
            (
              customer.id ||
              customer.customer_id ||
              customer.uid ||
              ""
            ).includes(searchTerm)
        );
        this.createUserCards(filteredCustomers);
      }
    });
  }

  /**
   * Setup event listeners for the page
   */
  setupEventListeners() {
    // Payment button
    const payButton = document.getElementById("pay-button");
    if (payButton) {
      payButton.addEventListener("click", () => this.handlePayment());
    }

    // Withdrawal method toggles
    document.querySelectorAll(".withdrawal-method").forEach((method) => {
      method.addEventListener("click", (e) =>
        this.handleWithdrawalMethodChange(e)
      );
    });

    // Payment method toggles
    document.querySelectorAll(".payment-method").forEach((method) => {
      method.addEventListener("click", (e) =>
        this.handlePaymentMethodChange(e)
      );
    });
  }

  /**
   * Handle payment button click
   */
  handlePayment() {
    // Implement payment logic here
    console.log("Payment initiated");
    alert("Payment functionality would be implemented here");
  }

  /**
   * Handle withdrawal method change
   */
  handleWithdrawalMethodChange(event) {
    const method = event.currentTarget;
    const toggle = method.querySelector(".toggle");

    // Toggle the switch
    toggle.classList.toggle("active");

    console.log("Withdrawal method changed:", method.dataset.method);
  }

  /**
   * Handle payment method change
   */
  handlePaymentMethodChange(event) {
    const method = event.currentTarget;
    const toggle = method.querySelector(".toggle");

    // Toggle the switch
    toggle.classList.toggle("active");

    console.log("Payment method changed:", method.dataset.method);
  }

  /**
   * Show error message to user
   */
  showError(message) {
    console.error(message);
    // You could implement a toast notification or modal here
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
        `;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  /**
   * Show loading modal
   */
  showLoadingModal() {
    const modal = document.getElementById("loading-modal");
    if (modal) {
      modal.style.display = "flex";
    }
  }

  /**
   * Hide loading modal with fade out animation
   */
  hideLoadingModal() {
    const modal = document.getElementById("loading-modal");
    if (modal) {
      modal.classList.add("fade-out");
      setTimeout(() => {
        modal.style.display = "none";
        modal.classList.remove("fade-out");
      }, 300);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const accountManager = new AccountManager();
  accountManager.init();
});
