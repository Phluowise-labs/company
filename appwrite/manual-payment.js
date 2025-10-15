// Manual Payment Initiation - JavaScript
import { AuthManager } from "./js/authManager.js";
import {
  client,
  databases,
  DB_ID,
  Appwrite,
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT,
} from "./js/config.js";

class ManualPaymentManager {
  constructor() {
    this.authManager = new AuthManager();
    this.user = null;
    this.companyId = null;
    this.branchId = null;
    this.collectionId = "payment_methods";
    this.initialized = false;
    this.paymentMethods = [];
  }

  // Initialize the manager with authentication
  async init() {
    try {
      // Ensure client is properly initialized
      if (!client.endpoint || !client.project) {
        console.log(
          "Initializing Appwrite client with:",
          APPWRITE_ENDPOINT,
          APPWRITE_PROJECT
        );
        client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
      }

      await this.authManager.initialize();
      this.user = this.authManager.user;

      if (!this.user) {
        console.error("No authenticated user found");
        this.showError("Authentication failed. Please log in again.");
        setTimeout(() => {
          window.location.href = "signin.html";
        }, 2000);
        return false;
      }

      this.companyId = this.authManager.companyId;
      this.branchId = this.user.$id; // User ID as branch ID
      this.initialized = true;

      console.log("Authentication successful:", {
        userId: this.user.$id,
        companyId: this.companyId,
        branchId: this.branchId,
      });

      // Load existing payment methods
      await this.loadPaymentMethods();

      // Setup event listeners
      this.setupEventListeners();

      return true;
    } catch (error) {
      console.error("Authentication failed:", error);
      this.showError(
        "Authentication failed: " + (error.message || "Please log in again.")
      );
      setTimeout(() => {
        window.location.href = "signin.html";
      }, 2000);
      return false;
    }
  }

  // Load existing payment methods from Appwrite
  async loadPaymentMethods() {
    try {
      if (!this.initialized) throw new Error("Manager not initialized");

      const response = await databases.listDocuments(DB_ID, this.collectionId, [
        Appwrite.Query.equal("user_id", this.user.$id),
        Appwrite.Query.equal("status", "active"),
        Appwrite.Query.orderDesc("created_at"),
      ]);

      this.paymentMethods = response.documents;
      this.renderPaymentMethods();
    } catch (error) {
      console.error("Failed to load payment methods:", error);
      this.showError("Failed to load payment methods. Please try again.");
    }
  }

  // Render payment methods in the UI
  renderPaymentMethods() {
    const container = document.getElementById("payment-methods-container");
    const noMethodsMessage = document.getElementById("no-methods-message");

    // Clear container
    container.innerHTML = "";

    if (this.paymentMethods.length === 0) {
      noMethodsMessage.classList.remove("hidden");
      return;
    }

    noMethodsMessage.classList.add("hidden");

    // Render each payment method
    this.paymentMethods.forEach((method) => {
      const methodCard = document.createElement("div");
      methodCard.className = "payment-method-card p-4";
      methodCard.dataset.id = method.$id;

      let methodDetails = "";
      if (method.type === "mobileMoney") {
        methodDetails = `
                    <div class="flex items-center mb-2">
                        <span class="text-blue-400 font-medium">${
                          method.network
                        }</span>
                        <span class="ml-auto ${
                          method.is_default
                            ? "bg-blue-500 text-xs px-2 py-1 rounded"
                            : "hidden"
                        }">Default</span>
                    </div>
                    <div class="text-lg font-medium text-white">${
                      method.name
                    }</div>
                    <div class="text-gray-400 mt-1">${
                      method.mobile_number
                    }</div>
                `;
      } else if (method.type === "creditCard") {
        methodDetails = `
                    <div class="flex items-center mb-2">
                        <span class="text-blue-400 font-medium">${
                          method.card_type
                        }</span>
                        <span class="ml-auto ${
                          method.is_default
                            ? "bg-blue-500 text-xs px-2 py-1 rounded"
                            : "hidden"
                        }">Default</span>
                    </div>
                    <div class="text-lg font-medium text-white">${
                      method.name
                    }</div>
                    <div class="text-gray-400 mt-1">${
                      method.card_number_masked
                    }</div>
                    <div class="text-gray-500 text-sm mt-1">Expires: ${
                      method.card_expiry
                    }</div>
                `;
      }

      // Add action buttons
      const actionButtons = `
                <div class="flex justify-between mt-4 pt-2 border-t border-gray-700">
                    <button class="text-sm text-gray-400 hover:text-white set-default-btn" data-id="${method.$id}">
                        Set as Default
                    </button>
                    <button class="text-sm text-red-400 hover:text-red-300 delete-btn" data-id="${method.$id}">
                        Delete
                    </button>
                </div>
            `;

      methodCard.innerHTML = methodDetails + actionButtons;
      container.appendChild(methodCard);
    });

    // Add event listeners to buttons
    this.addCardEventListeners();
  }

  // Add event listeners to payment method cards
  addCardEventListeners() {
    // Set default buttons
    document.querySelectorAll(".set-default-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        await this.setDefaultPaymentMethod(id);
      });
    });

    // Delete buttons
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        await this.deletePaymentMethod(id);
      });
    });
  }

  // Set up form and button event listeners
  setupEventListeners() {
    // Toggle between Mobile Money and Credit Card forms
    document.getElementById("mobileMoney-btn").addEventListener("click", () => {
      document
        .getElementById("mobileMoney-btn")
        .classList.remove("btn-secondary");
      document.getElementById("mobileMoney-btn").classList.add("btn-primary");
      document.getElementById("creditCard-btn").classList.remove("btn-primary");
      document.getElementById("creditCard-btn").classList.add("btn-secondary");
      document.getElementById("mobileMoney-form").classList.remove("hidden");
      document.getElementById("creditCard-form").classList.add("hidden");
    });

    document.getElementById("creditCard-btn").addEventListener("click", () => {
      document
        .getElementById("creditCard-btn")
        .classList.remove("btn-secondary");
      document.getElementById("creditCard-btn").classList.add("btn-primary");
      document
        .getElementById("mobileMoney-btn")
        .classList.remove("btn-primary");
      document.getElementById("mobileMoney-btn").classList.add("btn-secondary");
      document.getElementById("creditCard-form").classList.remove("hidden");
      document.getElementById("mobileMoney-form").classList.add("hidden");
    });

    // Mobile Money form submission
    document
      .getElementById("mobileMoney-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("mm-name").value;
        const network = document.getElementById("mm-network").value;
        const mobileNumber = document.getElementById("mm-mobile-number").value;

        await this.addMobileMoneyMethod(name, network, mobileNumber);
      });

    // Credit Card form submission
    document
      .getElementById("creditCard-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("cc-name").value;
        const cardType = document.getElementById("cc-type").value;
        const cardNumber = document.getElementById("cc-number").value;
        const expiry = document.getElementById("cc-expiry").value;

        await this.addCreditCardMethod(name, cardType, cardNumber, expiry);
      });
  }

  // Generate unique payment method ID
  generatePaymentMethodId() {
    return `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mask credit card number for security
  maskCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, "");
    return (
      cleaned.slice(0, 4) + "*".repeat(cleaned.length - 8) + cleaned.slice(-4)
    );
  }

  // Validate card expiry date
  validateCardExpiry(expiry) {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiry)) return false;

    const [month, year] = expiry.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expiryYear = parseInt(year);
    const expiryMonth = parseInt(month);

    if (
      expiryYear < currentYear ||
      (expiryYear === currentYear && expiryMonth < currentMonth)
    ) {
      return false;
    }
    return true;
  }

  // Add mobile money payment method
  async addMobileMoneyMethod(name, network, mobileNumber) {
    try {
      if (!this.initialized) throw new Error("Manager not initialized");

      if (!name || !network || !mobileNumber) {
        this.showError("Please fill in all required fields");
        return;
      }

      // Format mobile number
      mobileNumber = mobileNumber.replace(/\D/g, "");
      if (mobileNumber.length !== 10) {
        this.showError("Please enter a valid 10-digit mobile number");
        return;
      }

      const paymentMethod = {
        payment_method_id: this.generatePaymentMethodId(),
        user_id: this.user.$id,
        company_id: this.companyId,
        branch_id: this.branchId,
        type: "mobileMoney",
        name: name,
        network: network,
        mobile_number: mobileNumber,
        status: "inactive", // Initially inactive
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_used_at: null,
      };

      await databases.createDocument(
        DB_ID,
        this.collectionId,
        "unique()",
        paymentMethod
      );

      // Reset form
      document.getElementById("mobileMoney-form").reset();

      // Reload payment methods
      await this.loadPaymentMethods();

      this.showSuccess("Mobile money payment method added successfully");
    } catch (error) {
      console.error("Failed to add mobile money method:", error);
      this.showError("Failed to add payment method. Please try again.");
    }
  }

  // Add credit card payment method
  async addCreditCardMethod(name, cardType, cardNumber, expiry) {
    try {
      if (!this.initialized) throw new Error("Manager not initialized");

      if (!name || !cardType || !cardNumber || !expiry) {
        this.showError("Please fill in all required fields");
        return;
      }

      // Validate card number (basic validation)
      const cleanedCardNumber = cardNumber.replace(/\D/g, "");
      if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
        this.showError("Please enter a valid card number");
        return;
      }

      // Validate expiry date
      if (!this.validateCardExpiry(expiry)) {
        this.showError("Please enter a valid expiry date (MM/YY)");
        return;
      }

      const paymentMethod = {
        payment_method_id: this.generatePaymentMethodId(),
        user_id: this.user.$id,
        company_id: this.companyId,
        branch_id: this.branchId,
        type: "creditCard",
        name: name,
        card_type: cardType,
        card_number_masked: this.maskCardNumber(cardNumber),
        card_expiry: expiry,
        status: "inactive", // Initially inactive
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_used_at: null,
      };

      await databases.createDocument(
        DB_ID,
        this.collectionId,
        "unique()",
        paymentMethod
      );

      // Reset form
      document.getElementById("creditCard-form").reset();

      // Reload payment methods
      await this.loadPaymentMethods();

      this.showSuccess("Credit card payment method added successfully");
    } catch (error) {
      console.error("Failed to add credit card method:", error);
      this.showError("Failed to add payment method. Please try again.");
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId) {
    try {
      if (!this.initialized) throw new Error("Manager not initialized");

      // First, unset all other defaults
      for (const method of this.paymentMethods) {
        if (method.is_default) {
          await databases.updateDocument(DB_ID, this.collectionId, method.$id, {
            is_default: false,
            updated_at: new Date().toISOString(),
          });
        }
      }

      // Set the new default
      await databases.updateDocument(
        DB_ID,
        this.collectionId,
        paymentMethodId,
        {
          is_default: true,
          updated_at: new Date().toISOString(),
        }
      );

      // Reload payment methods
      await this.loadPaymentMethods();

      this.showSuccess("Default payment method updated");
    } catch (error) {
      console.error("Failed to set default payment method:", error);
      this.showError(
        "Failed to update default payment method. Please try again."
      );
    }
  }

  // Delete payment method (soft delete)
  async deletePaymentMethod(paymentMethodId) {
    try {
      if (!this.initialized) throw new Error("Manager not initialized");

      // Confirm deletion
      if (!confirm("Are you sure you want to delete this payment method?")) {
        return;
      }

      await databases.updateDocument(
        DB_ID,
        this.collectionId,
        paymentMethodId,
        {
          status: "inactive",
          updated_at: new Date().toISOString(),
        }
      );

      // Reload payment methods
      await this.loadPaymentMethods();

      this.showSuccess("Payment method deleted");
    } catch (error) {
      console.error("Failed to delete payment method:", error);
      this.showError("Failed to delete payment method. Please try again.");
    }
  }

  // Show success message
  showSuccess(message) {
    Swal.fire({
      title: "Success",
      text: message,
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
    });
  }

  // Show error message
  showError(message) {
    Swal.fire({
      title: "Error",
      text: message,
      icon: "error",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
    });
  }
}

// Initialize the manager when the DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  const manualPaymentManager = new ManualPaymentManager();
  await manualPaymentManager.init();
});
