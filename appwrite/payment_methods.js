// Payment Methods Manager - Complete UI and Database Integration
import {
  Client,
  Account,
  Databases,
  Query,
} from "https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm";

// Appwrite configuration
const APPWRITE_ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
const APPWRITE_PROJECT = "68b17582003582da69c8";
const DB_ID = "68b1b7590035346a3be9";

// Initialize client directly in this file to ensure proper configuration
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT);

// Appwrite services
const account = new Account(client);
const databases = new Databases(client);
const Appwrite = { Query }; // for queries

// Import ID from Appwrite SDK
import { ID } from "https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm";

class PaymentMethodsManager {
  constructor() {
    this.user = null;
    this.companyId = null;
    this.branchId = null;
    this.collectionId = "payment_methods";
    this.initialized = false;
  }

  // Initialize the manager with authentication
  async init() {
    try {
      // Always explicitly set endpoint and project to ensure they're properly initialized
      console.log(
        "Initializing Appwrite client with:",
        APPWRITE_ENDPOINT,
        APPWRITE_PROJECT
      );
      client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);

      // Verify there is an active Appwrite session; if not, this will throw 401
      await account.get();

      // Get authentication data from localStorage
      const userData = localStorage.getItem("user");
      const companyId = localStorage.getItem("companyId");
      const activeRole = localStorage.getItem("activeRole");

      if (!userData || !companyId) {
        throw new Error("Authentication data missing");
      }

      this.user = JSON.parse(userData);
      this.companyId = companyId;
      this.branchId = this.user.$id; // User ID as branch ID

      this.initialized = true;

      console.log("Authentication successful:", {
        userId: this.user.$id,
        companyId: this.companyId,
        branchId: this.branchId,
        role: activeRole,
      });

      return true;
    } catch (error) {
      console.error("Authentication failed:", error);

      // Check for specific error types
      let errorTitle = "Authentication Error";
      let errorMessage = error.message || "Please log in again to continue.";

      // Handle specific Appwrite errors
      if (error.code === 401) {
        errorMessage = "Your session has expired. Please log in again.";
      } else if (error.message && error.message.includes("project")) {
        errorTitle = "Configuration Error";
        errorMessage =
          "Invalid Appwrite project configuration. Please contact support.";
      }

      // Show detailed error in console for debugging
      console.log("Error details:", {
        message: error.message,
        code: error.code,
        type: error.type,
        stack: error.stack,
      });

      Swal.fire({
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        confirmButtonText: "Go to Login",
      }).then(() => {
        window.location.href = "signin.html";
      });
      return false;
    }
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
    if (!this.initialized) throw new Error("Manager not initialized");

    console.log("Adding mobile money method:", { name, network, mobileNumber });

    try {
      const paymentMethod = {
        payment_method_id: this.generatePaymentMethodId(),
        user_id: this.user.$id,
        company_id: this.companyId,
        branch_id: this.branchId,
        type: "mobileMoney",
        name: name,
        network: network,
        mobile_number: mobileNumber,
        status: "active",
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_used_at: null,
      };

      console.log("Payment method data:", paymentMethod);

      const response = await databases.createDocument(
        DB_ID,
        this.collectionId,
        ID.unique(),
        paymentMethod
      );

      console.log("Document created successfully:", response);
      return response;
    } catch (error) {
      console.error("Error creating mobile money method:", error);
      throw error;
    }
  }

  // Add credit card payment method
  async addCreditCardMethod(name, cardType, cardNumber, expiry) {
    if (!this.initialized) throw new Error("Manager not initialized");

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
      status: "active",
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_used_at: null,
    };

    return await databases.createDocument(
      DB_ID,
      this.collectionId,
      ID.unique(),
      paymentMethod
    );
  }

  // Get all payment methods for current user
  async getPaymentMethods() {
    if (!this.initialized) throw new Error("Manager not initialized");

    const response = await databases.listDocuments(DB_ID, this.collectionId, [
      Appwrite.Query.equal("user_id", this.user.$id),
      Appwrite.Query.equal("status", "active"),
      // Removed orderDesc('created_at') as this field is not in the schema
    ]);

    console.log("Retrieved payment methods:", response);
    return response.documents;
  }

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId) {
    if (!this.initialized) throw new Error("Manager not initialized");

    // First, unset all other defaults
    const allMethods = await this.getPaymentMethods();
    for (const method of allMethods) {
      if (method.is_default) {
        await databases.updateDocument(DB_ID, this.collectionId, method.$id, {
          is_default: false,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Set the new default
    return await databases.updateDocument(
      DB_ID,
      this.collectionId,
      paymentMethodId,
      {
        is_default: true,
        updated_at: new Date().toISOString(),
      }
    );
  }

  // Delete payment method (soft delete)
  async deletePaymentMethod(paymentMethodId) {
    if (!this.initialized) throw new Error("Manager not initialized");

    return await databases.updateDocument(
      DB_ID,
      this.collectionId,
      paymentMethodId,
      {
        status: "inactive",
        updated_at: new Date().toISOString(),
      }
    );
  }

  // Update last used timestamp
  async updateLastUsed(paymentMethodId) {
    if (!this.initialized) throw new Error("Manager not initialized");

    return await databases.updateDocument(
      DB_ID,
      this.collectionId,
      paymentMethodId,
      {
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  }

  // Update an existing payment method
  async updatePaymentMethod(paymentMethodId, data) {
    if (!this.initialized) throw new Error("Manager not initialized");

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    return await databases.updateDocument(
      DB_ID,
      this.collectionId,
      paymentMethodId,
      updateData
    );
  }

  // Format payment method for display
  formatPaymentMethodForDisplay(method) {
    if (method.type === "mobileMoney") {
      return {
        name: method.name,
        displayText: `${method.network} - ${method.mobile_number}`,
        isDefault: method.is_default,
      };
    } else if (method.type === "creditCard") {
      return {
        name: method.name,
        displayText: `${
          method.card_type
        } ending in ${method.card_number_masked.slice(-4)}`,
        isDefault: method.is_default,
      };
    }
    return {
      name: method.name,
      displayText: "Unknown payment method",
      isDefault: false,
    };
  }
}

// UI Management Class
class PaymentMethodsUI {
  constructor() {
    this.paymentManager = new PaymentMethodsManager();
    this.networkLogos = {
      mtn: "./images/mtn.png",
      airtel: "./images/AirtelTigo.jpg",
      vodafone: "./images/mobile.png",
      telecel: "./images/telecel.jpeg",
    };
    this.cardLogos = {
      visa: "../images/visacard.jpeg",
      mastercard: "../images/mastercard.png",
      amex: "../images/mastercard.png", // Fallback to mastercard
      discover: "../images/mastercard.png", // Fallback to mastercard
    };
  }

  // Initialize UI and payment manager
  async init() {
    const initialized = await this.paymentManager.init();

    if (!initialized) {
      Swal.fire({
        title: "Authentication Required",
        text: "Please sign in to manage payment methods",
        icon: "warning",
        background: "rgba(30, 30, 30, 0.9)",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
      }).then(() => {
        window.location.href = "signin.html";
      });
      return false;
    }

    this.setupEventListeners();
    await this.loadAndDisplayPaymentMethods();
    return true;
  }

  // Setup all event listeners
  setupEventListeners() {
    // Modal buttons
    document
      .getElementById("mobileMoneyBtn")
      ?.addEventListener("click", () => this.openMobileMoneyModal());
    document
      .getElementById("creditCardBtn")
      ?.addEventListener("click", () => this.openCreditCardModal());
    document
      .getElementById("chooseExistingBtn")
      ?.addEventListener("click", () => this.showAccountsPanel());

    // Mobile Money modal
    document
      .getElementById("setMobileBtn")
      ?.addEventListener("click", () => this.handleMobileMoneySubmit());
    document
      .getElementById("deleteMobileBtn")
      ?.addEventListener("click", () => this.closeMobileMoneyModal());

    // Credit Card modal
    document
      .getElementById("setCreditBtn")
      ?.addEventListener("click", () => this.handleCreditCardSubmit());
    document
      .getElementById("deleteCreditBtn")
      ?.addEventListener("click", () => this.closeCreditCardModal());

    // Account panel
    document
      .getElementById("continueBtn")
      ?.addEventListener("click", () => this.handleAccountSelection());
    document
      .getElementById("closeAccountsBtn")
      ?.addEventListener("click", () => this.hideAccountsPanel());

    // Card type selection
    document
      .getElementById("cardType")
      ?.addEventListener("change", (e) =>
        this.updateCardTypeIcon(e.target.value)
      );

    // Expiry date formatting
    document
      .getElementById("cardExpiry")
      ?.addEventListener("input", (e) => this.formatExpiryDate(e));
  }

  // Load and display payment methods
  async loadAndDisplayPaymentMethods() {
    try {
      const paymentMethods = await this.paymentManager.getPaymentMethods();
      const accountsContainer = document.getElementById("accounts-container");

      if (!accountsContainer) return;

      accountsContainer.innerHTML = "";

      paymentMethods.forEach((method) => {
        const formatted =
          this.paymentManager.formatPaymentMethodForDisplay(method);
        const accountItem = document.createElement("div");
        accountItem.className =
          "flex items-center justify-between bg-black bg-opacity-60 p-4 rounded-lg mb-3 border border-gray-800 hover:border-blue-500 transition-all duration-300 shadow-md";

        // Use exactly what's submitted in the database
        let logoSrc = "./images/mastercard.png"; // Default fallback

        if (method.type === "mobileMoney") {
          // Use exact values from the submitted form (HTML options)
          if (method.network === "MTN") {
            logoSrc = "./images/mtn.png";
          } else if (method.network === "AirtelTigo") {
            logoSrc = "./images/AirtelTigo.jpg";
          } else if (method.network === "Vodafone") {
            logoSrc = "./images/mobile.png";
          } else if (method.network === "Telecel") {
            logoSrc = "./images/telecel.jpeg";
          } else {
            logoSrc = "./images/mobile.png"; // Fallback generic mobile icon
          }
        } else if (method.type === "creditCard") {
          // Use exact card_type values from the form
          if (method.card_type === "visa") {
            logoSrc = "./images/visacard.jpeg";
          } else if (method.card_type === "mastercard") {
            logoSrc = "./images/mastercard.png";
          } else {
            logoSrc = "./images/mastercard.png"; // Default fallback
          }
        }

        const isDefaultBadge = method.is_default
          ? '<span class="bg-blue-600 text-xs text-white px-2 py-1 rounded-full ml-2">Default</span>'
          : "";

        // Hint helpers for icons
        let logoHint = "Payment method";
        if (method.type === "mobileMoney") {
          logoHint = `${method.network || "Mobile Money"} Mobile Money`;
        } else if (method.type === "creditCard") {
          logoHint = `${method.card_type || "Card"} Card`;
        }
        const defaultHint = method.is_default
          ? "Default payment method"
          : "Set as default";

        accountItem.innerHTML = `
          <div class="flex items-center flex-1">
            <div class="bg-gray-800 p-2 rounded-lg mr-3">
              <img src="${logoSrc}" alt="${method.type}" title="${logoHint}" aria-label="${logoHint}" class="w-8 h-8 object-contain" />
            </div>
            <div>
              <div class="text-white font-medium flex items-center">${
                formatted.name
              } ${isDefaultBadge}</div>
              <div class="text-gray-400 text-sm">${formatted.displayText}</div>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <button class="edit-btn p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200" data-id="${
              method.$id
            }" title="Edit payment method" aria-label="Edit payment method">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button class="default-btn p-2 bg-gray-700 hover:bg-blue-600 rounded-lg transition-colors duration-200 ${
              method.is_default ? "bg-blue-600" : ""
            }" data-id="${method.$id}" title="${defaultHint}" aria-label="${defaultHint}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button class="delete-btn p-2 bg-gray-700 hover:bg-red-700 rounded-lg transition-colors duration-200" data-id="${
              method.$id
            }" title="Delete payment method" aria-label="Delete payment method">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <label class="radio-label flex items-center cursor-pointer" title="Select this payment method" aria-label="Select this payment method">
              <input type="radio" name="account" value="${method.$id}" 
                data-name="${method.name}" 
                data-network="${method.network || ""}" 
                data-mobile-number="${method.mobile_number || ""}" 
                data-card-type="${method.card_type || ""}" 
                data-card-number-masked="${method.card_number_masked || ""}" 
                data-card-expiry="${method.card_expiry || ""}"
                class="hidden" aria-label="Select this payment method">
              <div class="custom-radio w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                <div class="w-3 h-3 rounded-full bg-blue-500 opacity-0 transition-opacity duration-200 selected-indicator"></div>
              </div>
            </label>
          </div>
        `;

        accountsContainer.appendChild(accountItem);

        // Add event listeners for the edit, default, and delete buttons
        const editBtn = accountItem.querySelector(".edit-btn");
        const defaultBtn = accountItem.querySelector(".default-btn");
        const deleteBtn = accountItem.querySelector(".delete-btn");
        const radioInput = accountItem.querySelector('input[type="radio"]');

        editBtn.addEventListener("click", () =>
          this.handleEditMethod(method.$id)
        );
        defaultBtn.addEventListener("click", () =>
          this.setAsDefault(method.$id)
        );
        deleteBtn.addEventListener("click", () =>
          this.deletePaymentMethod(method.$id)
        );
        radioInput.addEventListener("change", (e) => {
          if (e.target.checked) {
            // Remove active class from all items
            document
              .querySelectorAll("#accounts-container .selected-indicator")
              .forEach((dot) => {
                dot.style.opacity = "0";
              });

            // Add active class to selected item
            e.target.nextElementSibling.querySelector(
              ".selected-indicator"
            ).style.opacity = "1";
          }
        });
      });

      this.checkAccountsExist();
    } catch (error) {
      console.error("Error loading payment methods:", error);
      this.showError("Failed to load payment methods");
    }
  }

  async handleEditMethod(paymentMethodId) {
    try {
      const paymentMethods = await this.paymentManager.getPaymentMethods();
      const methodToEdit = paymentMethods.find(
        (method) => method.$id === paymentMethodId
      );

      if (!methodToEdit) {
        this.showError("Could not find the payment method to edit.");
        return;
      }

      if (methodToEdit.type === "mobileMoney") {
        document
          .getElementById("mobileMoneyModal")
          .setAttribute("data-editing-id", methodToEdit.$id);
        document.getElementById("mobileName").value = methodToEdit.name;
        document.getElementById("networkSelect").value = methodToEdit.network;
        document.getElementById("mobileNumber").value =
          methodToEdit.mobile_number;
        this.openMobileMoneyModal();
      } else if (methodToEdit.type === "creditCard") {
        document
          .getElementById("creditCardModal")
          .setAttribute("data-editing-id", methodToEdit.$id);
        document.getElementById("cardName").value = methodToEdit.name;
        document.getElementById("cardType").value = methodToEdit.card_type;
        document.getElementById("cardNumber").value =
          methodToEdit.card_number_masked;
        document.getElementById("cardExpiry").value = methodToEdit.card_expiry;
        document.getElementById("cardCVC").value = ""; // CVC is not stored
        this.openCreditCardModal();
      }
    } catch (error) {
      console.error("Error opening edit form:", error);
      this.showError("Failed to open the edit form.");
    }
  }

  // Check if accounts exist and show/hide message
  checkAccountsExist() {
    const noAccountsMessage = document.getElementById("no-accounts-message");
    const accountsContainer = document.getElementById("accounts-container");

    if (accountsContainer && accountsContainer.children.length === 0) {
      noAccountsMessage?.classList.remove("hidden");
    } else {
      noAccountsMessage?.classList.add("hidden");
    }
  }

  // Modal management methods
  openMobileMoneyModal() {
    const modal = document.getElementById("mobileMoneyModal");
    modal?.classList.remove("modal-closed");
    modal?.classList.add("modal-open");
  }

  closeMobileMoneyModal() {
    const modal = document.getElementById("mobileMoneyModal");
    modal?.classList.remove("modal-open");
    modal?.classList.add("modal-closed");
    this.resetMobileMoneyForm();
  }

  openCreditCardModal() {
    const modal = document.getElementById("creditCardModal");
    modal?.classList.remove("modal-closed");
    modal?.classList.add("modal-open");
  }

  closeCreditCardModal() {
    const modal = document.getElementById("creditCardModal");
    modal?.classList.remove("modal-open");
    modal?.classList.add("modal-closed");
    this.resetCreditCardForm();
  }

  showAccountsPanel() {
    const panel = document.getElementById("accountsPanel");
    panel?.classList.remove("hidden");
    this.checkAccountsExist();
  }

  hideAccountsPanel() {
    const panel = document.getElementById("accountsPanel");
    panel?.classList.add("hidden");
  }

  // Form handlers
  async handleMobileMoneySubmit() {
    const name = document.getElementById("mobileName")?.value;
    const network = document.getElementById("networkSelect")?.value;
    const number = document.getElementById("mobileNumber")?.value;

    if (!name || !network || !number) {
      this.showError("Please fill in all fields");
      return;
    }

    try {
      console.log("Submitting mobile money form with data:", {
        name,
        network,
        number,
      });

      // Show loading indicator
      Swal.fire({
        title: "Saving...",
        text: "Please wait while we save your payment method",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const editingId = document
        .getElementById("mobileMoneyModal")
        .getAttribute("data-editing-id");
      let result;

      if (editingId) {
        result = await this.paymentManager.updatePaymentMethod(editingId, {
          name,
          network,
          mobile_number: number,
        });
        console.log("Updated payment method:", result);
      } else {
        result = await this.paymentManager.addMobileMoneyMethod(
          name,
          network,
          number
        );
        console.log("Added new payment method:", result);
      }

      // Close loading indicator
      Swal.close();

      if (!result) {
        throw new Error(
          "Failed to save payment method - no response from server"
        );
      }

      this.closeMobileMoneyModal();

      // Clear the editing ID
      document
        .getElementById("mobileMoneyModal")
        .removeAttribute("data-editing-id");

      if (editingId) {
        this.showSuccess("Mobile Money payment method has been updated");
      } else {
        this.showSuccess("Mobile Money payment method has been added");
      }

      this.showAccountsPanel();
      await this.loadAndDisplayPaymentMethods();
    } catch (error) {
      console.error("Error saving mobile money method:", error);
      this.showError(
        `Failed to save mobile money payment method: ${
          error.message || "Unknown error"
        }`
      );
    }
  }

  async handleCreditCardSubmit() {
    const name = document.getElementById("cardName")?.value;
    const cardType = document.getElementById("cardType")?.value;
    const cardNumber = document.getElementById("cardNumber")?.value;
    const expiry = document.getElementById("cardExpiry")?.value;
    const cvc = document.getElementById("cardCVC")?.value;

    if (!name || !cardType || !cardNumber || !expiry || !cvc) {
      this.showError("Please fill in all fields");
      return;
    }

    if (!this.paymentManager.validateCardExpiry(expiry)) {
      this.showError("Please enter a valid expiry date (MM/YY)");
      return;
    }

    try {
      const editingId = document
        .getElementById("creditCardModal")
        .getAttribute("data-editing-id");
      if (editingId) {
        await this.paymentManager.updatePaymentMethod(editingId, {
          name,
          card_type: cardType,
          card_number_masked: this.paymentManager.maskCardNumber(cardNumber),
          card_expiry: expiry,
        });
        this.showSuccess("Credit Card payment method has been updated");
      } else {
        await this.paymentManager.addCreditCardMethod(
          name,
          cardType,
          cardNumber,
          expiry
        );
        this.showSuccess("Credit Card payment method has been added");
      }
      this.closeCreditCardModal();
      this.showAccountsPanel();
      await this.loadAndDisplayPaymentMethods();
    } catch (error) {
      console.error("Error saving credit card method:", error);
      this.showError("Failed to save credit card payment method");
    }
  }

  async handleAccountSelection() {
    const selectedAccount = document.querySelector(
      'input[name="account"]:checked'
    );

    if (!selectedAccount) {
      this.showError("Please select a payment method to continue");
      return;
    }

    try {
      const paymentMethodId = selectedAccount.value;
      await this.paymentManager.updateLastUsed(paymentMethodId);

      const paymentMethods = await this.paymentManager.getPaymentMethods();
      const selectedMethod = paymentMethods.find(
        (method) => method.$id === paymentMethodId
      );
      const formatted =
        this.paymentManager.formatPaymentMethodForDisplay(selectedMethod);

      // Populate the form fields with the selected payment method data
      if (selectedMethod.type === "mobileMoney") {
        document.getElementById("mobileName").value = selectedMethod.name;
        document.getElementById("networkSelect").value = selectedMethod.network;
        document.getElementById("mobileNumber").value =
          selectedMethod.mobile_number;
      } else if (selectedMethod.type === "creditCard") {
        document.getElementById("cardName").value = selectedMethod.name;
        document.getElementById("cardType").value = selectedMethod.card_type;
        document.getElementById("cardNumber").value =
          selectedMethod.card_number_masked;
        document.getElementById("cardExpiry").value =
          selectedMethod.card_expiry;
      }

      this.showSuccess(`You have selected ${formatted.displayText}`);
    } catch (error) {
      console.error("Error processing payment method selection:", error);
      this.showError("Failed to process payment method selection");
    }
  }

  // Public methods for global access
  async setAsDefault(paymentMethodId) {
    try {
      await this.paymentManager.setDefaultPaymentMethod(paymentMethodId);
      await this.loadAndDisplayPaymentMethods();
      this.showSuccess("Default payment method updated");
    } catch (error) {
      console.error("Error setting default payment method:", error);
      this.showError("Failed to set default payment method");
    }
  }

  async deletePaymentMethod(paymentMethodId) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This payment method will be removed",
      icon: "warning",
      showCancelButton: true,
      background: "rgba(30, 30, 30, 0.9)",
      color: "#fff",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await this.paymentManager.deletePaymentMethod(paymentMethodId);
        await this.loadAndDisplayPaymentMethods();
        this.showSuccess("Payment method has been removed");
      } catch (error) {
        console.error("Error deleting payment method:", error);
        this.showError("Failed to delete payment method");
      }
    }
  }

  // Utility methods
  updateCardTypeIcon(cardType) {
    const cardTypeIcon = document.getElementById("cardTypeIcon");
    if (cardTypeIcon && this.cardLogos[cardType]) {
      cardTypeIcon.src = this.cardLogos[cardType];
    }
  }

  formatExpiryDate(e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }
    if (value.length > 5) {
      value = value.substring(0, 5);
    }
    e.target.value = value;
  }

  resetMobileMoneyForm() {
    document.getElementById("mobileName").value = "";
    document.getElementById("networkSelect").selectedIndex = 0;
    document.getElementById("mobileNumber").value = "";
  }

  resetCreditCardForm() {
    document.getElementById("cardName").value = "";
    document.getElementById("cardType").selectedIndex = 0;
    document.getElementById("cardNumber").value = "";
    document.getElementById("cardExpiry").value = "";
    document.getElementById("cardCVC").value = "";
  }

  showSuccess(message) {
    Swal.fire({
      title: "Success!",
      text: message,
      icon: "success",
      background: "rgba(30, 30, 30, 0.9)",
      color: "#fff",
      confirmButtonColor: "#3b82f6",
    });
  }

  showError(message) {
    Swal.fire({
      title: "Error!",
      text: message,
      icon: "error",
      background: "rgba(30, 30, 30, 0.9)",
      color: "#fff",
      confirmButtonColor: "#3b82f6",
    });
  }
}

// Global instance for HTML onclick handlers
let paymentUI;

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  paymentUI = new PaymentMethodsUI();
  await paymentUI.init();
});

// Export for module use
export { PaymentMethodsManager, PaymentMethodsUI };
