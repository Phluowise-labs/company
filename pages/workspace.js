// workspace.js
const baseUrl = "https://phluowise.azurewebsites.net";
const authToken = localStorage.getItem("authToken");

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
  };
}

// ------------------ REAL ENDPOINTS ------------------ //

// Fetch company profile
async function fetchCompanyProfile() {
  try {
    if (!authToken) {
      console.warn("No auth token found");
      return null;
    }

    const response = await fetch(`${baseUrl}/company-admin/GetProfile`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching company profile:", err);
    return null;
  }
}

// Fetch branches
async function fetchBranches() {
  try {
    const company = JSON.parse(localStorage.getItem("loggedInCompany") || "{}");
    const companyId = company?.id;

    if (!companyId) {
      console.error("No company ID found");
      return [];
    }

    const response = await fetch(
      `${baseUrl}/company-admin/GetBranches/${companyId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) throw new Error("Failed to fetch branches");

    return await response.json();
  } catch (err) {
    console.error("Error fetching branches:", err);
    return [];
  }
}

// ------------------ DUMMY ENDPOINTS (to replace later) ------------------ //
async function fetchActiveOrders() {
  return { count: 12, change: 5 };
}
async function fetchRevenue(timeRange = 30) {
  return { amount: 5400, change: 12 };
}
async function fetchSatisfaction() {
  return { score: 87, change: 3 };
}
async function fetchBranchPerformance(timeRange = 30) {
  return [
    { branchName: "Headquarters", revenue: 2200, rating: 92, change: 5 },
    { branchName: "Branch A", revenue: 1500, rating: 85, change: 2 },
    { branchName: "Branch B", revenue: 1700, rating: 88, change: -1 },
  ];
}

// ------------------ UI INITIALIZER ------------------ //
async function initDashboard() {
  document.body.classList.add("loading");

  // ---- Company Profile ----
  const companyData = await fetchCompanyProfile();
  if (companyData) {
    document.getElementById("companyNameDisplay").textContent =
      companyData.companyName || "Unknown Company";

    document.getElementById("companyDescDisplay").textContent =
      companyData.description || "No description available";

    if (companyData.profileImage) {
      document.getElementById("companyLogo").src = companyData.profileImage;
    }
  }

  // ---- Branches ----
  try {
    const branches = await fetchBranches();
    const branchCount = Array.isArray(branches) ? branches.length : 0;

    // Update summary card (Total Branches)
    const totalBranchesEl = document.getElementById("totalBranches");
    if (totalBranchesEl) {
      totalBranchesEl.textContent = branchCount;
    }

    // Update badge
    const badge = document.getElementById("branchCount");
    if (badge) {
      badge.textContent = branchCount;
      badge.style.display = branchCount > 0 ? "flex" : "none";
    }

    // Fill lists
    const branchesList = document.getElementById("branchesList");
    const branchesDropdown = document.getElementById("branchesDropdownList");

    branchesList.innerHTML = "";
    branchesDropdown.innerHTML = "";

    if (branchCount > 0) {
      branches.forEach((b) => {
        // Card list
        const div = document.createElement("div");
        div.className = "p-2 bg-white/5 rounded-lg";
        div.textContent = b.name || b.branchName;
        branchesList.appendChild(div);

        // Dropdown
        const dd = document.createElement("div");
        dd.className =
          "flex justify-between items-center p-2 bg-white/5 rounded-lg";
        dd.innerHTML = `<span>${b.name || b.branchName}</span>
                        <span class="text-gray-400 text-sm">${
                          b.status || "Active"
                        }</span>`;
        branchesDropdown.appendChild(dd);
      });
    } else {
      branchesList.innerHTML = `<div class="text-gray-400 text-center">No branches found</div>`;
      branchesDropdown.innerHTML = `<div class="text-gray-400 text-center">No branches available</div>`;
    }
  } catch (err) {
    console.error("Branch count error:", err);
  }

  // ---- Metrics ----
  const orders = await fetchActiveOrders();
  document.getElementById("activeOrders").textContent = orders.count || 0;
  document.getElementById("ordersChange").textContent = `${
    orders.change || 0
  }%`;

  const revenue = await fetchRevenue();
  document.getElementById("totalRevenue").textContent = `₵${
    revenue.amount || 0
  }`;
  document.getElementById("revenueChange").textContent = `${
    revenue.change || 0
  }%`;

  const satisfaction = await fetchSatisfaction();
  document.getElementById("satisfactionScore").textContent = `${
    satisfaction.score || 0
  }%`;
  document.getElementById("satisfactionChange").textContent = `${
    satisfaction.change || 0
  }%`;

  // ---- Branch Performance ----
  const branchPerf = await fetchBranchPerformance();
  const tbody = document.getElementById("branchPerformanceBody");
  tbody.innerHTML = "";

  if (branchPerf.length > 0) {
    branchPerf.forEach((bp) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="py-3">${bp.branchName}</td>
        <td class="py-3">₵${bp.revenue}</td>
        <td class="py-3">${bp.rating}%</td>
        <td class="py-3">${bp.change}%</td>
        <td class="py-3 text-right">
          <button class="text-blue-500 hover:underline">View</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-500">No performance data</td></tr>`;
  }

  document.body.classList.remove("loading");
}

// ------------------ REFRESH HANDLER ------------------ //
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();

  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      initDashboard();
    });
  }
});
