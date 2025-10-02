// Chart.js is loaded globally via <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
import { MetricsService } from "./metrics.js";
import {
  account,
  databases,
  DB_ID,
  BRANCH_COLL,
  Appwrite,
  isCompanyAdminBranch,
} from "./config.js";

// Simple registry to manage chart instances across re-renders
const __chartRegistry = {
  instances: {},
  destroyAll() {
    Object.keys(this.instances).forEach((key) => {
      try {
        const instance = this.instances[key];
        if (instance && typeof instance.destroy === "function") {
          instance.destroy();
        }
      } catch (_) {}
      delete this.instances[key];
    });
  },
  set(key, instance) {
    if (!key) return;
    if (this.instances[key]) {
      try {
        this.instances[key].destroy();
      } catch (_) {}
    }
    this.instances[key] = instance;
  },
};

export async function renderDashboard() {
  // Show loading modal
  showLoadingModal();

  try {
    const user = await account.get();
    if (!user) return;

    // Check if user has a role preference in localStorage
    const storedRole = localStorage.getItem("activeRole");

    // Get user role from Appwrite user metadata or determine from branch data
    const branchResult = await databases.listDocuments(DB_ID, BRANCH_COLL, [
      Appwrite.Query.equal("company_id", user.$id),
    ]);

    let activeRole = "branch"; // default
    let canSwitchRole = false;

    if (branchResult.documents.length > 0) {
      const branch = branchResult.documents[0];
      // If branch_id equals company_id, it's admin type
      if (isCompanyAdminBranch(branch, user.$id)) {
        activeRole = "admin";
        canSwitchRole = true; // Admin can switch to branch view
      }
    }

    // Use stored role if available and user can switch roles
    if (storedRole && canSwitchRole) {
      activeRole = storedRole;
    }

    if (activeRole === "admin")
      renderAdminDashboard(user, canSwitchRole, user.$id);
    else renderBranchDashboard(user, canSwitchRole, user.$id);

    // Hide loading modal after successful render
    hideLoadingModal();
  } catch (error) {
    console.error("Error rendering dashboard:", error);
    // Hide loading modal even on error
    hideLoadingModal();
  }
}

// =============================
// Admin Dashboard
// =============================
async function renderAdminDashboard(user, canSwitchRole, companyId) {
  const dashboardContent = document.getElementById("dashboard-content");
  if (!dashboardContent) return;

  dashboardContent.innerHTML = `
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-white">Phluowise Logistics Dashboard</h1>
          <p class="text-gray-400">Welcome back, ${
            user.name
          } — Monitor your delivery operations across all branches</p>
        </div>
        ${
          canSwitchRole
            ? '<button id="switchRoleBtn" class="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded">Switch to Branch</button>'
            : ""
        }
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 p-3 sm:p-4 lg:p-6 rounded-xl relative group">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-200 text-xs sm:text-sm">Today's Deliveries</p>
            <p class="text-xl sm:text-2xl font-bold text-white">47</p>
            <p class="text-blue-200 text-xs sm:text-sm">+12% vs yesterday</p>
          </div>
          <div class="bg-blue-500/30 p-2 sm:p-3 rounded-lg text-sm sm:text-base">🚚</div>
        </div>
        <button class="helpBtn absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-help text-white text-xs sm:text-sm" data-help="Today's total deliveries across all branches.">?</button>
      </div>

      <div class="bg-gradient-to-r from-green-600 to-green-700 p-3 sm:p-4 lg:p-6 rounded-xl relative group">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-200 text-xs sm:text-sm">Active Orders</p>
            <p class="text-xl sm:text-2xl font-bold text-white">23</p>
            <p class="text-green-200 text-xs sm:text-sm">15 in progress, 8 pending</p>
          </div>
          <div class="bg-green-500/30 p-2 sm:p-3 rounded-lg text-sm sm:text-base">📦</div>
        </div>
        <button class="helpBtn absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center cursor-help text-white text-xs sm:text-sm" data-help="Orders currently being processed.">?</button>
      </div>

      <div class="bg-gradient-to-r from-orange-600 to-orange-700 p-3 sm:p-4 lg:p-6 rounded-xl relative group">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-200 text-xs sm:text-sm">Pending Pickups</p>
            <p class="text-xl sm:text-2xl font-bold text-white">18</p>
            <p class="text-orange-200 text-xs sm:text-sm">5 urgent (within 2hrs)</p>
          </div>
          <div class="bg-orange-500/30 p-2 sm:p-3 rounded-lg text-sm sm:text-base">🧾</div>
        </div>
        <button class="helpBtn absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full flex items-center justify-center cursor-help text-white text-xs sm:text-sm" data-help="Orders waiting for pickup.">?</button>
      </div>

      <div class="bg-gradient-to-r from-purple-600 to-purple-700 p-3 sm:p-4 lg:p-6 rounded-xl relative group">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-200 text-xs sm:text-sm">Customer Rating</p>
            <p class="text-xl sm:text-2xl font-bold text-white">4.8★</p>
            <p class="text-purple-200 text-xs sm:text-sm">Based on 156 reviews</p>
          </div>
          <div class="bg-purple-500/30 p-2 sm:p-3 rounded-lg text-sm sm:text-base">⭐</div>
        </div>
        <button class="helpBtn absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 rounded-full flex items-center justify-center cursor-help text-white text-xs sm:text-sm" data-help="Average customer rating across branches.">?</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div class="bg-zinc-900/80 backdrop-blur p-3 sm:p-4 lg:p-6 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors shadow-lg shadow-black/20 lg:h-96">
        <div class="flex justify-between items-center mb-3 sm:mb-4">
          <h3 class="text-base sm:text-lg font-semibold">Customers per Branch</h3>
          <button class="helpBtn text-gray-400 hover:text-white text-xl" data-help="Total registered customers for each branch.">?</button>
        </div>
        <div class="chart-container h-full">
          <canvas id="customersChart" class="w-full h-full"></canvas>
        </div>
      </div>

      <div class="bg-zinc-900/80 backdrop-blur p-3 sm:p-4 lg:p-6 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors shadow-lg shadow-black/20">
        <div class="flex justify-between items-center mb-2 sm:mb-3">
          <h3 class="text-base sm:text-lg font-semibold">Branch Status</h3>
          <button class="helpBtn text-gray-400 hover:text-white text-lg sm:text-xl" data-help="Shows branches online, offline, or idle.">?</button>
        </div>
        <div class="chart-container h-48 sm:h-64">
          <canvas id="branchStatusChart"></canvas>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div class="bg-zinc-900/80 backdrop-blur p-3 sm:p-4 lg:p-6 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors shadow-lg shadow-black/20">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
          <div class="flex items-center gap-2">
            <h3 class="text-base sm:text-lg font-semibold">Transactions Summary</h3>
            <button class="helpBtn text-gray-400 hover:text-white text-lg sm:text-xl" data-help="Total transactions aggregated by the selected time range.">?</button>
          </div>
          <div class="inline-flex rounded-md border border-zinc-700 overflow-hidden" role="tablist" aria-label="Transactions Range">
            <button class="tx-range px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-zinc-800 focus:outline-none" data-range="day" aria-selected="true">Day</button>
            <button class="tx-range px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-zinc-800 focus:outline-none" data-range="week">Week</button>
            <button class="tx-range px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-zinc-800 focus:outline-none" data-range="month">Month</button>
            <button class="tx-range px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-zinc-800 focus:outline-none" data-range="year">Year</button>
          </div>
        </div>
        <div class="h-48 sm:h-64">
          <canvas id="transactionsChart"></canvas>
        </div>
      </div>

      <div class="bg-zinc-900/80 backdrop-blur p-3 sm:p-4 lg:p-6 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors shadow-lg shadow-black/20">
        <div class="flex justify-between items-center mb-2 sm:mb-3">
          <h3 class="text-base sm:text-lg font-semibold">Drivers per Branch</h3>
          <button class="helpBtn text-gray-400 hover:text-white text-lg sm:text-xl" data-help="Number of active drivers in each branch.">?</button>
        </div>
        <div class="h-48 sm:h-64">
          <canvas id="driversChart"></canvas>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div class="bg-zinc-900 p-3 sm:p-4 lg:p-6 rounded-xl relative group border border-zinc-800">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
          <h3 class="text-base sm:text-lg font-semibold">Daily Delivery Performance</h3>
          <div class="flex items-center space-x-2">
            <select class="bg-gray-800 text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
            </select>
            <button class="helpBtn w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center cursor-help text-white text-xs" data-help="Track delivery completion rates over time.">?</button>
          </div>
        </div>
        <div class="h-48 sm:h-64">
          <canvas id="deliveryChart" class="w-full h-full"></canvas>
        </div>
      </div>

      <div class="bg-zinc-900 p-6 rounded-xl relative group border border-zinc-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Branch Performance</h3>
          <div class="flex items-center space-x-2">
            <button class="helpBtn w-5 h-5 bg-green-500 rounded-full flex items-center justify-center cursor-help text-white text-xs" data-help="Compare delivery performance across branches.">?</button>
          </div>
        </div>
        <div class="h-64">
          <canvas id="branchChart" class="w-full h-full"></canvas>
        </div>
      </div>
    </div>



    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-zinc-900/80 backdrop-blur p-6 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors shadow-lg shadow-black/20">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold">Transactions Summary</h3>
            <button class="helpBtn text-gray-400 hover:text-white text-xl" data-help="Total transactions aggregated by the selected time range.">?</button>
          </div>
          <div class="inline-flex rounded-md border border-zinc-700 overflow-hidden" role="tablist" aria-label="Transactions Range">
            <button class="tx-range px-3 py-1.5 text-sm hover:bg-zinc-800 focus:outline-none" data-range="day" aria-selected="true">Day</button>
            <button class="tx-range px-3 py-1.5 text-sm hover:bg-zinc-800 focus:outline-none" data-range="week">Week</button>
            <button class="tx-range px-3 py-1.5 text-sm hover:bg-zinc-800 focus:outline-none" data-range="month">Month</button>
            <button class="tx-range px-3 py-1.5 text-sm hover:bg-zinc-800 focus:outline-none" data-range="year">Year</button>
          </div>
        </div>
        <canvas id="transactionsChart"></canvas>
      </div>

      <div class="bg-zinc-900/80 backdrop-blur p-6 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors shadow-lg shadow-black/20">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-semibold">Drivers per Branch</h3>
          <button class="helpBtn text-gray-400 hover:text-white text-xl" data-help="Number of active drivers in each branch.">?</button>
        </div>
        <canvas id="driversChart"></canvas>
      </div>
    </div>
  `;

  const metrics = await MetricsService.fetchAdminMetrics(companyId);
  hydrateAdminKPIs(metrics);
  initializeAdminCharts(metrics);

  // Setup help button listeners
  document.querySelectorAll(".helpBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      Swal.fire({ icon: "info", title: "Info", text: btn.dataset.help });
    });
  });

  // Switch role button
  if (canSwitchRole) {
    document.getElementById("switchRoleBtn").addEventListener("click", () => {
      // Store role preference in localStorage for session
      localStorage.setItem("activeRole", "branch");
      renderDashboard();
    });
  }
}

// =============================
// Branch Dashboard
// =============================
async function renderBranchDashboard(user, canSwitchRole, companyId) {
  const dashboardContent = document.getElementById("dashboard-content");
  if (!dashboardContent) return;

  dashboardContent.innerHTML = `
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-white">Branch Dashboard</h1>
          <p class="text-gray-400">Welcome back, ${
            user.name
          } — Monitor operations for your branch</p>
        </div>
        ${
          canSwitchRole
            ? '<button id="switchRoleBtn" class="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded">Switch to Admin</button>'
            : ""
        }
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl relative group">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-200 text-sm">Today's Deliveries</p>
            <p class="text-2xl font-bold text-white">12</p>
            <p class="text-blue-200 text-sm">+8% vs yesterday</p>
          </div>
          <div class="bg-blue-500/30 p-3 rounded-lg">🚚</div>
        </div>
        <button class="helpBtn absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-help text-white text-sm" data-help="Number of deliveries completed today for this branch.">?</button>
      </div>

      <div class="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-xl relative group">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-200 text-sm">Active Orders</p>
            <p class="text-2xl font-bold text-white">7</p>
            <p class="text-green-200 text-sm">Processing & in transit</p>
          </div>
          <div class="bg-green-500/30 p-3 rounded-lg">📦</div>
        </div>
        <button class="helpBtn absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center cursor-help text-white text-sm" data-help="Orders currently being processed in this branch.">?</button>
      </div>

      <div class="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-xl relative group">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-200 text-sm">Pending Pickups</p>
            <p class="text-2xl font-bold text-white">5</p>
            <p class="text-orange-200 text-sm">1 urgent</p>
          </div>
          <div class="bg-orange-500/30 p-3 rounded-lg">🧾</div>
        </div>
        <button class="helpBtn absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center cursor-help text-white text-sm" data-help="Orders waiting for pickup in this branch.">?</button>
      </div>

      <div class="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-xl relative group">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-200 text-sm">Customer Rating</p>
            <p class="text-2xl font-bold text-white">4.5★</p>
            <p class="text-purple-200 text-sm">Branch average</p>
          </div>
          <div class="bg-purple-500/30 p-3 rounded-lg">⭐</div>
        </div>
        <button class="helpBtn absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center cursor-help text-white text-sm" data-help="Average customer rating for this branch.">?</button>
      </div>

      <div class="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 rounded-xl relative group">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-emerald-200 text-sm">Online Drivers</p>
            <p class="text-2xl font-bold text-white">8</p>
            <p class="text-emerald-200 text-sm">Currently available</p>
          </div>
          <div class="bg-emerald-500/30 p-3 rounded-lg">🛵</div>
        </div>
        <button class="helpBtn absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center cursor-help text-white text-sm" data-help="Drivers currently online for this branch.">?</button>
      </div>

      <div class="bg-gradient-to-r from-amber-600 to-amber-700 p-6 rounded-xl relative group">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-amber-200 text-sm">Idle Drivers</p>
            <p class="text-2xl font-bold text-white">3</p>
            <p class="text-amber-200 text-sm">Idle / on break</p>
          </div>
          <div class="bg-amber-500/30 p-3 rounded-lg">⏸️</div>
        </div>
        <button class="helpBtn absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center cursor-help text-white text-sm" data-help="Drivers idle or on break.">?</button>
      </div>
    </div>

    <div class="bg-zinc-900 p-6 rounded-xl mb-8 border border-zinc-800 relative group">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Branch Operations</h3>
        <button class="helpBtn w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center cursor-help text-white text-xs" data-help="Deliveries completed every hour of the day.">?</button>
      </div>
      <div class="h-64">
        <canvas id="branchOperationsChart" class="w-full h-full"></canvas>
      </div>
    </div>

    <div class="bg-zinc-900 p-6 rounded-xl mb-8 border border-zinc-800 relative group">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold">Transactions Summary</h3>
          <button class="helpBtn w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center cursor-help text-white text-xs" data-help="Total transactions aggregated by the selected time range for this branch.">?</button>
        </div>
        <div class="inline-flex rounded-md border border-zinc-700 overflow-hidden" role="tablist" aria-label="Branch Transactions Range">
          <button class="tx-range-branch px-3 py-1.5 text-sm hover:bg-zinc-800 focus:outline-none" data-range="day" aria-selected="true">Day</button>
          <button class="tx-range-branch px-3 py-1.5 text-sm hover:bg-zinc-800 focus:outline-none" data-range="week">Week</button>
          <button class="tx-range-branch px-3 py-1.5 text-sm hover:bg-zinc-800 focus:outline-none" data-range="month">Month</button>
          <button class="tx-range-branch px-3 py-1.5 text-sm hover:bg-zinc-800 focus:outline-none" data-range="year">Year</button>
        </div>
      </div>
      <div class="h-64">
        <canvas id="branchTransactionsChart" class="w-full h-full"></canvas>
      </div>
    </div>
  `;

  const branchId = user.$id; // assumes branch user id maps to branch_id; adjust if different
  const metrics = await MetricsService.fetchBranchMetrics(companyId, branchId);
  hydrateBranchKPIs(metrics);
  initializeBranchCharts(metrics);

  document.querySelectorAll(".helpBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      Swal.fire({ icon: "info", title: "Info", text: btn.dataset.help });
    });
  });

  if (canSwitchRole) {
    document.getElementById("switchRoleBtn").addEventListener("click", () => {
      // Store role preference in localStorage for session
      localStorage.setItem("activeRole", "admin");
      renderDashboard();
    });
  }
}

// =============================
// Card Helper Function
// =============================
function hexToRgba(hex, alpha) {
  const parsed = hex.replace("#", "");
  const bigint = parseInt(
    parsed.length === 3
      ? parsed
          .split("")
          .map((c) => c + c)
          .join("")
      : parsed,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function pickIcon(title) {
  const t = title.toLowerCase();
  if (t.includes("deliver")) return "🚚";
  if (t.includes("order")) return "📦";
  if (t.includes("pickup")) return "🧾";
  if (t.includes("rating")) return "⭐";
  if (t.includes("driver")) return "🛵";
  if (t.includes("customer")) return "👥";
  if (t.includes("transaction")) return "💳";
  return "📊";
}

function createInfoCard(title, value, color, helpText) {
  const softBg = hexToRgba(color, 0.12);
  const ringBg = hexToRgba(color, 0.35);
  const icon = pickIcon(title);
  return `
    <div class="relative group bg-zinc-900/80 backdrop-blur p-5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all shadow-lg shadow-black/20 hover:translate-y-px">
      <button class="helpBtn absolute top-2 right-2 text-gray-400 hover:text-white text-xl" data-help="${helpText}" aria-label="More info about ${title}">?</button>
      <div class="flex items-center gap-4">
        <div class="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-medium" style="background:${softBg}; color:${color}; box-shadow: 0 0 0 4px ${ringBg} inset;">
          ${icon}
        </div>
        <div class="min-w-0">
          <p class="text-gray-400 text-sm truncate">${title}</p>
          <p class="text-2xl font-extrabold" style="color:${color}">${value}</p>
        </div>
      </div>
    </div>
  `;
}

// =============================
// Charts Initialization
// =============================
function hydrateAdminKPIs(metrics) {
  // Replace hard-coded card numbers by metrics
  // Since cards are raw HTML, we could re-render with template literals if needed.
  // For simplicity here, we set text contents if found.
}

function initializeAdminCharts(metrics) {
  if (typeof window.Chart === "undefined") {
    console.warn("Chart.js not loaded; skipping charts.");
    return;
  }

  __chartRegistry.destroyAll();

  // Daily Deliveries - Line
  const deliveryEl = document.getElementById("deliveryChart");
  if (deliveryEl)
    __chartRegistry.set(
      "deliveryChart",
      new Chart(deliveryEl.getContext("2d"), {
        type: "line",
        data: {
          labels: metrics?.charts?.deliveryPerformance?.labels || [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun",
          ],
          datasets: [
            {
              label: "Deliveries Completed",
              data: metrics?.charts?.deliveryPerformance?.values || [
                42, 38, 45, 52, 47, 39, 43,
              ],
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59,130,246,0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "rgba(255,255,255,0.1)" },
              ticks: { color: "#9ca3af" },
            },
            x: {
              grid: { color: "rgba(255,255,255,0.1)" },
              ticks: { color: "#9ca3af" },
            },
          },
        },
      })
    );

  // Branch Performance - Doughnut
  const branchEl = document.getElementById("branchChart");
  if (branchEl)
    __chartRegistry.set(
      "branchChart",
      new Chart(branchEl.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: metrics?.charts?.branchPerformance?.labels || [
            "Main",
            "North",
            "South",
            "East",
          ],
          datasets: [
            {
              data: metrics?.charts?.branchPerformance?.values || [
                35, 28, 22, 15,
              ],
              backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#9ca3af", padding: 20 },
            },
          },
        },
      })
    );

  // Customers per Branch - Bar
  const customersEl = document.getElementById("customersChart");
  if (customersEl)
    __chartRegistry.set(
      "customersChart",
      new Chart(customersEl.getContext("2d"), {
        type: "bar",
        data: {
          labels: metrics?.charts?.customersPerBranch?.labels || [
            "Main",
            "North",
            "South",
            "East",
          ],
          datasets: [
            {
              label: "Customers",
              data: metrics?.charts?.customersPerBranch?.values || [
                120, 95, 80, 60,
              ],
              backgroundColor: "#3b82f6",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: window.innerWidth < 768 ? 1.5 : 2,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: "#9ca3af" } },
            x: { ticks: { color: "#9ca3af", maxRotation: 45, minRotation: 0 } },
          },
          layout: {
            padding: {
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            },
          },
        },
      })
    );

  // Branch Status - Pie
  const branchStatusEl = document.getElementById("branchStatusChart");
  if (branchStatusEl)
    __chartRegistry.set(
      "branchStatusChart",
      new Chart(branchStatusEl.getContext("2d"), {
        type: "pie",
        data: {
          labels: metrics?.charts?.branchStatus?.labels || [
            "Online",
            "Idle",
            "Offline",
          ],
          datasets: [
            {
              data: metrics?.charts?.branchStatus?.values || [3, 1, 1],
              backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#9ca3af", padding: 20 },
            },
          },
        },
      })
    );

  // Transactions Summary - Line with range controls
  const transactionsEl = document.getElementById("transactionsChart");
  if (transactionsEl) {
    const txColors = { border: "#f59e0b", fill: "rgba(245,158,11,0.1)" };
    const txData = metrics?.charts?.transactionsSummary;
    const txPresets = txData
      ? {
          day: { labels: txData.day.labels, data: txData.day.values },
          week: { labels: txData.week.labels, data: txData.week.values },
          month: { labels: txData.month.labels, data: txData.month.values },
          year: { labels: txData.year.labels, data: txData.year.values },
        }
      : {
          day: {
            labels: ["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm"],
            data: [12, 18, 22, 40, 55, 60, 48, 30],
          },
          week: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            data: [230, 210, 260, 300, 420, 380, 310],
          },
          month: {
            labels: ["W1", "W2", "W3", "W4"],
            data: [1200, 1500, 1100, 1400],
          },
          year: {
            labels: ["Q1", "Q2", "Q3", "Q4"],
            data: [5000, 6200, 5800, 7000],
          },
        };
    const storedRange = localStorage.getItem("transactionsRange") || "day";
    const initial = txPresets[storedRange] || txPresets.day;

    __chartRegistry.set(
      "transactionsChart",
      new Chart(transactionsEl.getContext("2d"), {
        type: "line",
        data: {
          labels: initial.labels,
          datasets: [
            {
              label: "Transactions",
              data: initial.data,
              borderColor: txColors.border,
              backgroundColor: txColors.fill,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: "#9ca3af" } },
            x: { ticks: { color: "#9ca3af" } },
          },
        },
      })
    );

    const rangeButtons = Array.from(document.querySelectorAll(".tx-range"));
    function setActiveRange(range) {
      rangeButtons.forEach((btn) => {
        const active = btn.dataset.range === range;
        btn.setAttribute("aria-selected", active ? "true" : "false");
        if (active) btn.classList.add("bg-zinc-800");
        else btn.classList.remove("bg-zinc-800");
      });
    }
    function updateTransactionsChart(range) {
      const preset = txPresets[range] || txPresets.day;
      const chart = __chartRegistry.instances["transactionsChart"];
      if (!chart) return;
      chart.data.labels = preset.labels;
      chart.data.datasets[0].data = preset.data;
      chart.update();
      localStorage.setItem("transactionsRange", range);
      setActiveRange(range);
    }
    // init active state + listeners
    setActiveRange(storedRange);
    rangeButtons.forEach((btn) => {
      btn.addEventListener("click", () =>
        updateTransactionsChart(btn.dataset.range)
      );
    });
  }

  // Drivers per Branch - Bar
  const driversEl = document.getElementById("driversChart");
  if (driversEl)
    __chartRegistry.set(
      "driversChart",
      new Chart(driversEl.getContext("2d"), {
        type: "bar",
        data: {
          labels: metrics?.charts?.driversPerBranch?.labels || [
            "Main",
            "North",
            "South",
            "East",
          ],
          datasets: [
            {
              label: "Drivers",
              data: metrics?.charts?.driversPerBranch?.values || [10, 7, 5, 3],
              backgroundColor: "#8b5cf6",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: "#9ca3af" } },
            x: { ticks: { color: "#9ca3af" } },
          },
        },
      })
    );
}

function hydrateBranchKPIs(metrics) {
  // Placeholder for setting branch KPI card values if we add data-ids
}

function initializeBranchCharts(metrics) {
  if (typeof window.Chart === "undefined") {
    console.warn("Chart.js not loaded; skipping charts.");
    return;
  }
  __chartRegistry.destroyAll();

  const ctx = document.getElementById("branchOperationsChart");
  if (ctx) {
    __chartRegistry.set(
      "branchOperationsChart",
      new Chart(ctx.getContext("2d"), {
        type: "line",
        data: {
          labels: metrics?.charts?.branchOperations?.labels || [
            "8AM",
            "9AM",
            "10AM",
            "11AM",
            "12PM",
            "1PM",
            "2PM",
            "3PM",
            "4PM",
            "5PM",
            "6PM",
            "7PM",
          ],
          datasets: [
            {
              label: "Deliveries",
              data: metrics?.charts?.branchOperations?.values || [
                2, 5, 8, 12, 15, 18, 20, 22, 23, 23, 23, 23,
              ],
              borderColor: "#10b981",
              backgroundColor: "rgba(16,185,129,0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "rgba(255,255,255,0.1)" },
              ticks: { color: "#9ca3af" },
            },
            x: {
              grid: { color: "rgba(255,255,255,0.1)" },
              ticks: { color: "#9ca3af" },
            },
          },
        },
      })
    );
  }
  // Branch Transactions Summary - Line with range controls
  const branchTxEl = document.getElementById("branchTransactionsChart");
  if (branchTxEl) {
    const txColors = { border: "#f59e0b", fill: "rgba(245,158,11,0.1)" };
    const txPresets = {
      day: {
        labels: ["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm"],
        data: [4, 6, 8, 10, 12, 14, 11, 7],
      },
      week: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data: [120, 100, 140, 180, 220, 190, 150],
      },
      month: { labels: ["W1", "W2", "W3", "W4"], data: [400, 520, 460, 580] },
      year: {
        labels: ["Q1", "Q2", "Q3", "Q4"],
        data: [1600, 1900, 1750, 2100],
      },
    };
    const storedRange =
      localStorage.getItem("branchTransactionsRange") || "day";
    const initial = txPresets[storedRange] || txPresets.day;

    __chartRegistry.set(
      "branchTransactionsChart",
      new Chart(branchTxEl.getContext("2d"), {
        type: "line",
        data: {
          labels: initial.labels,
          datasets: [
            {
              label: "Transactions",
              data: initial.data,
              borderColor: txColors.border,
              backgroundColor: txColors.fill,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: "#9ca3af" } },
            x: { ticks: { color: "#9ca3af" } },
          },
        },
      })
    );

    const rangeButtons = Array.from(
      document.querySelectorAll(".tx-range-branch")
    );
    function setActiveRange(range) {
      rangeButtons.forEach((btn) => {
        const active = btn.dataset.range === range;
        btn.setAttribute("aria-selected", active ? "true" : "false");
        if (active) btn.classList.add("bg-zinc-800");
        else btn.classList.remove("bg-zinc-800");
      });
    }
    function updateBranchTransactionsChart(range) {
      const preset = txPresets[range] || txPresets.day;
      const chart = __chartRegistry.instances["branchTransactionsChart"];
      if (!chart) return;
      chart.data.labels = preset.labels;
      chart.data.datasets[0].data = preset.data;
      chart.update();
      localStorage.setItem("branchTransactionsRange", range);
      setActiveRange(range);
    }
    setActiveRange(storedRange);
    rangeButtons.forEach((btn) => {
      btn.addEventListener("click", () =>
        updateBranchTransactionsChart(btn.dataset.range)
      );
    });
  }
}

// Auto-render on DOMContentLoaded (guard against duplicate registration)
if (!window.__dashboardDOMContentHooked) {
  document.addEventListener("DOMContentLoaded", () => {
    renderDashboard();
  });
  window.__dashboardDOMContentHooked = true;
}

// Loading Modal Functions
function showLoadingModal() {
  const modal = document.getElementById("loadingModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.remove("fade-out");
  }
}

function hideLoadingModal() {
  const modal = document.getElementById("loadingModal");
  if (modal) {
    modal.classList.add("fade-out");
    setTimeout(() => {
      modal.style.display = "none";
    }, 500);
  }
}
