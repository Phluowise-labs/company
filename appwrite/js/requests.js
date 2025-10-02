import {
  databases,
  account,
  ORDERS_COLL,
  ORDER_ITEMS_COLL,
  PRODUCTS_COLL,
  DB_ID,
  isCompanyAdminBranch,
  Appwrite,
} from "./config.js";

class RequestsManager {
  constructor() {
    this.orders = [];
    this.currentTab = "all";
    this.selectedOrder = null;
    this.isLoading = false;

    this.init();
  }

  async init() {
    // Show loading modal
    this.showLoadingModal();

    try {
      // Check if authentication was successful (AuthManager auto-initializes)
      const user = localStorage.getItem("user");
      const activeRole = localStorage.getItem("activeRole");
      const companyId = localStorage.getItem("companyId");

      if (!user || !activeRole || !companyId) {
        // Redirect to signin if authentication data is missing
        window.location.href = "signin.html";
        return;
      }

      this.setupEventListeners();
      await this.loadOrders();

      // Hide loading modal after successful initialization
      this.hideLoadingModal();
    } catch (error) {
      console.error("Failed to initialize requests manager:", error);
      // Hide loading modal even on error
      this.hideLoadingModal();
      // If authentication fails, redirect to signin
      window.location.href = "signin.html";
    }
  }

  setupEventListeners() {
    // Tab navigation
    document
      .getElementById("all-tab")
      .addEventListener("click", () => this.switchTab("all"));
    document
      .getElementById("pending-tab")
      .addEventListener("click", () => this.switchTab("pending"));
    document
      .getElementById("accepted-tab")
      .addEventListener("click", () => this.switchTab("accepted"));
    document
      .getElementById("denied-tab")
      .addEventListener("click", () => this.switchTab("denied"));

    // Modal controls
    document
      .getElementById("close-modal-btn")
      .addEventListener("click", () => this.closeModal());
    document.getElementById("order-modal").addEventListener("click", (e) => {
      if (e.target.id === "order-modal") this.closeModal();
    });

    // Modal action buttons
    document
      .getElementById("modal-accept-btn")
      .addEventListener("click", () => this.updateOrderStatus("accepted"));
    document
      .getElementById("modal-deny-btn")
      .addEventListener("click", () => this.updateOrderStatus("denied"));
    document
      .getElementById("modal-pending-btn")
      .addEventListener("click", () => this.updateOrderStatus("pending"));

    // Retry button
    document
      .getElementById("retry-btn")
      .addEventListener("click", () => this.loadOrders());

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeModal();
    });
  }

  async loadOrders() {
    try {
      this.showLoading(true);
      console.log("🔄 Starting to load orders from Appwrite...");

      const user = JSON.parse(localStorage.getItem("user"));
      const activeRole = localStorage.getItem("activeRole");
      const companyId = localStorage.getItem("companyId");

      console.log("👤 User context:", { user: user?.$id, activeRole, companyId });

      if (!user) {
        throw new Error("User information not available");
      }

      let queries = [];

      // Always filter by branch - get branch_id from user context
      // For branch users: use their user ID as branch_id
      // For admin users: use their user ID as branch_id (since admin branch_id equals company_id)
      const branchId = user.$id; // User ID corresponds to branch_id in the system
      queries.push(Appwrite.Query.equal("branch_id", branchId));
      console.log("🏢 Filtering by branch_id:", branchId, "for role:", activeRole);

      // Use safe database call with error handling like metrics.js
      console.log("📡 Making Appwrite API call with queries:", queries);
      const response = await this.safeListDocuments(
        DB_ID,
        ORDERS_COLL,
        queries
      );

      console.log("📊 Appwrite response:", {
        totalDocuments: response.total,
        documentsCount: response.documents.length,
        firstDocument: response.documents[0] || "No documents"
      });

      // Load orders with their associated products
      this.orders = await Promise.all(
        response.documents.map(async (order) => {
          const normalizedOrder = this.normalizeOrder(order);
          normalizedOrder.products = await this.loadOrderProducts(order.$id);
          return normalizedOrder;
        })
      );

      console.log("✅ Orders loaded successfully:", {
        ordersCount: this.orders.length,
        orders: this.orders.map(o => ({ id: o.id, status: o.status, customerName: o.customerName }))
      });

      this.renderOrders();
      this.updateTabCounts();
      this.showContent();
    } catch (error) {
      console.error("❌ Failed to load orders:", error);
      this.showError("Failed to load orders. Please try again.");
    } finally {
      this.showLoading(false);
    }
  }

  // Load products for a specific order using the junction table
  async loadOrderProducts(orderId) {
    try {
      // Get order items for this order
      const orderItemsResponse = await this.safeListDocuments(
        DB_ID,
        ORDER_ITEMS_COLL,
        [Appwrite.Query.equal("order_id", orderId)]
      );

      // Load product details for each order item
      const products = await Promise.all(
        orderItemsResponse.documents.map(async (orderItem) => {
          try {
            const productResponse = await databases.getDocument(
              DB_ID,
              PRODUCTS_COLL,
              orderItem.product_id
            );

            return {
              name: productResponse.product_name || "Unknown Product",
              description: productResponse.product_type || "",
              price: parseFloat(orderItem.unit_price) || 0,
              quantity: parseInt(orderItem.quantity) || 1,
              productId: orderItem.product_id,
              image: productResponse.product_image || null,
            };
          } catch (error) {
            console.warn(
              `Failed to load product ${orderItem.product_id}:`,
              error
            );
            return {
              name: "Product Not Found",
              description: "",
              price: parseFloat(orderItem.unit_price) || 0,
              quantity: parseInt(orderItem.quantity) || 1,
              productId: orderItem.product_id,
              image: null,
            };
          }
        })
      );

      return products;
    } catch (error) {
      console.warn(`Failed to load products for order ${orderId}:`, error);
      return [];
    }
  }

  // Safe database call helper (similar to metrics.js)
  async safeListDocuments(db, coll, queries) {
    try {
      return await databases.listDocuments(db, coll, queries);
    } catch (e) {
      console.error("Database query failed:", e);

      // Return empty result set when API is unavailable
      return {
        documents: [],
        total: 0,
      };
    }
  }

  normalizeOrder(order) {
    return {
      id: order.$id,
      name: order.customerName || "Unknown Customer",
      location: order.customerLocation || "Unknown Location",
      date: this.formatDate(order.$createdAt),
      time: this.formatTime(order.$createdAt),
      status: order.status || "pending",
      total: order.totalAmount || 0,
      notes: order.notes || "No additional notes",
      products: [], // Will be populated by loadOrderProducts
      customerPhone: order.customerPhone || "",
      branchId: order.branch_id || "",
      companyId: order.company_id || "",
    };
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Unknown Date";
    }
  }

  formatTime(timeString) {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Unknown Time";
    }
  }

  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.classList.remove("active", "border-blue-500", "border-b-2", "text-white");
      btn.classList.add("text-gray-400");
    });

    const activeTab = document.getElementById(`${tab}-tab`);
    activeTab.classList.add("active", "border-blue-500", "border-b-2", "text-white");
    activeTab.classList.remove("text-gray-400");

    // Update tab content
    document.querySelectorAll(".tab-pane").forEach((pane) => {
      pane.classList.add("hidden");
      pane.classList.remove("active");
    });

    const activeContent = document.getElementById(`${tab}-content`);
    activeContent.classList.remove("hidden");
    activeContent.classList.add("active");

    this.renderOrders();
  }

  renderOrders() {
    const containers = {
      all: document.getElementById("all-container"),
      pending: document.getElementById("pending-container"),
      accepted: document.getElementById("accepted-container"),
      denied: document.getElementById("denied-container"),
    };

    // Clear all containers
    Object.values(containers).forEach((container) => {
      container.innerHTML = "";
    });

    // Filter and render orders
    const filteredOrders =
      this.currentTab === "all"
        ? this.orders
        : this.orders.filter((order) => order.status === this.currentTab);

    if (filteredOrders.length === 0) {
      this.showEmptyState();
      return;
    }

    this.hideEmptyState();

    filteredOrders.forEach((order) => {
      const orderCard = this.createOrderCard(order);

      // Add to appropriate containers
      if (this.currentTab === "all") {
        containers.all.appendChild(orderCard.cloneNode(true));
      } else {
        containers[this.currentTab].appendChild(orderCard);
      }
    });

    // Re-attach event listeners for new cards
    this.attachCardEventListeners();
  }

  createOrderCard(order) {
    const card = document.createElement("div");
    card.className = "glassmorphism p-6 order-card card-hover cursor-pointer";
    card.dataset.orderId = order.id;

    const statusColor =
      {
        pending: "bg-amber-600",
        accepted: "bg-green-600",
        denied: "bg-red-600",
      }[order.status] || "bg-gray-600";

    const statusIcon =
      {
        pending: "fas fa-clock",
        accepted: "fas fa-check",
        denied: "fas fa-times",
      }[order.status] || "fas fa-question";

    card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-lg">${order.name
                          .charAt(0)
                          .toUpperCase()}</span>
                    </div>
                    <div>
                        <h3 class="font-semibold text-white text-lg">${
                          order.name
                        }</h3>
                        <p class="text-gray-400 text-sm">
                            <i class="fas fa-map-marker-alt mr-1"></i>${
                              order.location
                            }
                        </p>
                    </div>
                </div>
                <div class="flex flex-col items-end">
                    <span class="${statusColor} text-white px-3 py-1 rounded-full text-xs font-medium mb-2">
                        <i class="${statusIcon} mr-1"></i>${
      order.status.charAt(0).toUpperCase() + order.status.slice(1)
    }
                    </span>
                    <span class="text-green-400 font-bold text-lg">GH₵ ${order.total.toFixed(
                      2
                    )}</span>
                </div>
            </div>
            
            <div class="flex justify-between items-center text-sm text-gray-400 mb-4">
                <span><i class="fas fa-calendar mr-1"></i>${order.date}</span>
                <span><i class="fas fa-clock mr-1"></i>${order.time}</span>
            </div>
            
            <div class="flex justify-between items-center">
                <span class="text-gray-400 text-sm">
                    <i class="fas fa-box mr-1"></i>${
                      order.products.length
                    } item${order.products.length !== 1 ? "s" : ""}
                </span>
                <button class="view-details-btn text-blue-400 hover:text-blue-300 text-sm font-medium">
                    View Details <i class="fas fa-arrow-right ml-1"></i>
                </button>
            </div>
        `;

    return card;
  }

  attachCardEventListeners() {
    document.querySelectorAll(".order-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const orderId = card.dataset.orderId;
        const order = this.orders.find((o) => o.id === orderId);
        if (order) {
          this.showOrderModal(order);
        }
      });
    });
  }

  showOrderModal(order) {
    this.selectedOrder = order;

    // Populate modal with order data
    document.getElementById("customer-avatar").textContent = order.name
      .charAt(0)
      .toUpperCase();
    document.getElementById("customer-name").textContent = order.name;
    document.getElementById("customer-location").textContent = order.location;
    document.getElementById("order-date").textContent = order.date;
    document.getElementById("order-time").textContent = order.time;
    document.getElementById(
      "modal-total"
    ).textContent = `GH₵ ${order.total.toFixed(2)}`;
    document.getElementById("modal-notes").textContent = order.notes;

    // Populate products
    const productsContainer = document.getElementById("modal-products");
    productsContainer.innerHTML = "";

    if (order.products && order.products.length > 0) {
      order.products.forEach((product) => {
        const productElement = document.createElement("div");
        productElement.className =
          "glassmorphism p-4 flex justify-between items-center";
        productElement.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                            ${product.image ? 
                                `<img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover rounded-lg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                 <i class="fas fa-box text-gray-400 hidden"></i>` :
                                `<i class="fas fa-box text-gray-400"></i>`
                            }
                        </div>
                        <div>
                            <h4 class="font-medium text-white">${
                              product.name || "Unknown Product"
                            }</h4>
                            <p class="text-gray-400 text-sm">Qty: ${
                              product.quantity || 1
                            }</p>
                        </div>
                    </div>
                    <span class="text-green-400 font-semibold">GH₵ ${(
                      product.price || 0
                    ).toFixed(2)}</span>
                `;
        productsContainer.appendChild(productElement);
      });
    } else {
      productsContainer.innerHTML =
        '<p class="text-gray-400 text-center py-4">No products listed</p>';
    }

    // Show/hide action buttons based on order status
    const acceptBtn = document.getElementById("modal-accept-btn");
    const denyBtn = document.getElementById("modal-deny-btn");
    const pendingBtn = document.getElementById("modal-pending-btn");

    // Hide all buttons first
    [acceptBtn, denyBtn, pendingBtn].forEach(
      (btn) => (btn.style.display = "none")
    );

    // Show appropriate buttons based on current status
    if (order.status === "pending") {
      acceptBtn.style.display = "inline-flex";
      denyBtn.style.display = "inline-flex";
    } else if (order.status === "accepted") {
      denyBtn.style.display = "inline-flex";
      pendingBtn.style.display = "inline-flex";
    } else if (order.status === "denied") {
      acceptBtn.style.display = "inline-flex";
      pendingBtn.style.display = "inline-flex";
    }

    // Show modal
    const modal = document.getElementById("order-modal");
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    const modal = document.getElementById("order-modal");
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
    this.selectedOrder = null;
  }

  async updateOrderStatus(newStatus) {
    if (!this.selectedOrder) return;

    try {
      // Show loading state
      const buttons = document.querySelectorAll("#order-modal button");
      buttons.forEach((btn) => (btn.disabled = true));

      // Prepare update data with status and corresponding datetime field
      const updateData = { status: newStatus };
      const currentDateTime = new Date().toISOString();
      
      // Set the appropriate datetime field based on the new status
      switch (newStatus) {
        case 'accepted':
          updateData.accepted_at = currentDateTime;
          break;
        case 'denied':
          updateData.denied_at = currentDateTime;
          break;
        case 'cancelled':
          updateData.cancelled_at = currentDateTime;
          break;
        case 'completed':
          updateData.completed_at = currentDateTime;
          break;
      }

      // Use safe database update
      await this.safeUpdateDocument(DB_ID, ORDERS_COLL, this.selectedOrder.id, updateData);

      // Update local order data
      const orderIndex = this.orders.findIndex(
        (o) => o.id === this.selectedOrder.id
      );
      if (orderIndex !== -1) {
        this.orders[orderIndex].status = newStatus;
      }

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Order has been ${newStatus}`,
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
      });

      this.closeModal();
      this.renderOrders();
      this.updateTabCounts();
    } catch (error) {
      console.error("Failed to update order status:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update order status. Please try again.",
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      // Re-enable buttons
      const buttons = document.querySelectorAll("#order-modal button");
      buttons.forEach((btn) => (btn.disabled = false));
    }
  }

  // Safe database update helper
  async safeUpdateDocument(db, coll, docId, data) {
    try {
      return await databases.updateDocument(db, coll, docId, data);
    } catch (e) {
      console.error("Database update failed:", e);
      throw e; // Re-throw to handle in calling function
    }
  }

  updateTabCounts() {
    const counts = {
      all: this.orders.length,
      pending: this.orders.filter((o) => o.status === "pending").length,
      accepted: this.orders.filter((o) => o.status === "accepted").length,
      denied: this.orders.filter((o) => o.status === "denied").length,
    };

    Object.entries(counts).forEach(([status, count]) => {
      const countElement = document.getElementById(`${status}-count`);
      if (countElement) {
        countElement.textContent = count;
      }
    });
  }

  showLoading(show) {
    const loadingState = document.getElementById("loading-state");
    const mainContent = document.getElementById("main-content");
    const errorState = document.getElementById("error-state");

    if (show) {
      loadingState.classList.remove("hidden");
      mainContent.classList.add("hidden");
      errorState.classList.add("hidden");
    } else {
      loadingState.classList.add("hidden");
    }
  }

  showContent() {
    const mainContent = document.getElementById("main-content");
    const errorState = document.getElementById("error-state");

    mainContent.classList.remove("hidden");
    errorState.classList.add("hidden");
  }

  showError(message) {
    const errorState = document.getElementById("error-state");
    const mainContent = document.getElementById("main-content");
    const loadingState = document.getElementById("loading-state");
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = message;
    errorState.classList.remove("hidden");
    mainContent.classList.add("hidden");
    loadingState.classList.add("hidden");
  }

  showEmptyState() {
    document.getElementById("empty-state").classList.remove("hidden");
  }

  hideEmptyState() {
    document.getElementById("empty-state").classList.add("hidden");
  }

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

// Initialize the requests manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new RequestsManager();
});

export default RequestsManager;
