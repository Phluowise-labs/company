// workspace.js
import { databases, DB_ID, BRANCH_COLL, Appwrite, account } from "./js/config.js";

// ------------------ APPWRITE FUNCTIONS ------------------ //

async function fetchBranches() {
  try {
    const user = await account.get();
    const companyId = user.$id;

    if (!companyId) {
      console.error("No company ID found");
      return [];
    }

    const result = await databases.listDocuments(
      DB_ID,
      BRANCH_COLL,
      [Appwrite.Query.equal("company_id", companyId)]
    );

    return result.documents.map(branch => ({
      name: branch.branch_name || "",
      branchName: branch.branch_name || "",
      branchLocation: branch.location || "",
      branchCode: branch.branch_code || "",
      status: branch.is_active ? "active" : "inactive",
      isActive: branch.is_active || false,
      active: branch.is_active || false,
      branchStatus: branch.is_active ? "active" : "inactive",
      activeStatus: branch.is_active ? "active" : "inactive"
    }));
  } catch (err) {
    console.error("Error fetching branches:", err);
    return [];
  }
}

// ------------------ DUMMY ENDPOINTS (replace later) ------------------ //
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

// ------------------ APPWRITE FUNCTIONS ------------------ //

async function fetchCompanyProfile() {
  try {
    const user = await account.get();
    const companyId = user.$id;

    // Get the main branch (admin branch) for company profile
    const result = await databases.listDocuments(
      DB_ID,
      BRANCH_COLL,
      [Appwrite.Query.equal("company_id", companyId), Appwrite.Query.equal("branch_type", "admin")]
    );

    if (result.documents.length > 0) {
      const branch = result.documents[0];
      return {
        companyName: branch.branch_name || "Unknown Company",
        description: branch.description || "No description available",
        profileImage: branch.profile_image || ""
      };
    }

    return null;
  } catch (err) {
    console.error("Error fetching company profile:", err);
    return null;
  }
}

// ------------------ UI INITIALIZER ------------------ //
async function initDashboard() {
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
const totalBranches = Array.isArray(branches) ? branches.length : 0;
const resolveStatus = (b) => {
  const raw = (b?.status ?? b?.branchStatus ?? b?.activeStatus ?? "")
    .toString()
    .trim()
    .toLowerCase();
  const isInactiveBool = b?.isActive === false || b?.active === false;
  const isActiveBool = b?.isActive === true || b?.active === true;
  if (isInactiveBool) return "inactive";
  if (isActiveBool) return "active";
  if (["inactive", "disabled", "suspended", "closed"].includes(raw)) return "inactive";
  if (["active", "enabled", "open"].includes(raw)) return "active";
  return "active"; // default when unspecified
};

const activeBranches = Array.isArray(branches)
  ? branches.filter((b) => resolveStatus(b) === "active").length
  : 0;
const inactiveBranches = totalBranches - activeBranches;

// 🔹 Update summary card
const totalBranchesEl = document.getElementById("totalBranches");
if (totalBranchesEl) {
  totalBranchesEl.textContent = `${totalBranches}`;
}

const activeBranchesEl = document.getElementById("activeBranches");
if (activeBranchesEl) {
  activeBranchesEl.textContent = activeBranches; // ✅ separate active count
}

const inactiveBranchesEl = document.getElementById("inactiveBranches");
if (inactiveBranchesEl) {
  inactiveBranchesEl.textContent = inactiveBranches; // ✅ separate inactive count
}


    
    // Fill lists
    const branchesList = document.getElementById("branchesList");
    const branchesDropdown = document.getElementById("branchesDropdownList");

    branchesList.innerHTML = "";
    branchesDropdown.innerHTML = "";

    if (totalBranches > 0) {
      branches.forEach((b) => {
        const div = document.createElement("div");
        div.className = "p-2 bg-white/5 rounded-lg";
        div.textContent = b.name || b.branchName;
        branchesList.appendChild(div);

        const dd = document.createElement("div");
        dd.className =
          "flex justify-between items-center p-2 bg-white/5 rounded-lg";
        const s = resolveStatus(b);
        dd.innerHTML = `
        <span>${b.name || b.branchName}</span>
        <span class="text-gray-400 text-sm">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
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
