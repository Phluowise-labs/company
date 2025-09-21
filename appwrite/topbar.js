console.log("✅ Topbar script loaded");

import { account, databases, DB_ID, BRANCH_COLL, Appwrite } from "./js/config.js";

// ---- Guard against double inits across multiple injections
if (!window.__TOPBAR_INIT__) {
  window.__TOPBAR_INIT__ = true;

  // 🔓 Logout click (delegated, so it works no matter when the element appears)
  const onLogoutClick = (e) => {
    const btn = e.target.closest(".logout-btn");
    if (!btn) return;

    e.preventDefault();

    const doConfirm = () =>
      new Promise((resolve) => {
        if (window.Swal && typeof Swal.fire === "function") {
          Swal.fire({
            title: "Log out?",
            text: "You'll be signed out!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, log out",
          }).then((res) => resolve(res.isConfirmed));
        } else {
          resolve(window.confirm("Log out?"));
        }
      });

    doConfirm().then(async (ok) => {
      if (!ok) return;

      // Unified logout cleanup
      await (async function clearAuthState() {
        // End Appwrite session (non-fatal if none)
        try { await account.deleteSessions(); } catch (e) { console.warn("deleteSessions:", e?.message || e); }

        // Clear localStorage keys
        try {
          const localKeys = [
            "activeRole",
            "branchTransactionsRange",
            "canSwitchRole",
            "companyId",
            "cookieFallback",
            "subscriptionData",
            "transactionsRange",
            "user",
            // impersonation/workspace context
            "loggedInCompany",
            "loggedInBranch",
            "impersonateBranchId",
            "impersonateBranchName",
            "impersonateMode"
          ];
          localKeys.forEach((k) => localStorage.removeItem(k));
        } catch (_) {}

        // Clear sessionStorage keys
        try {
          const sessionKeys = ["activeRole", "companyId", "userName", "homePage"];
          sessionKeys.forEach((k) => sessionStorage.removeItem(k));
        } catch (_) {}
      })();

      // Redirect
      window.location.href = "signin.html";
    });
  };

  // Delegate on the whole document so it always catches the click
  document.addEventListener("click", onLogoutClick, true);

  // 🔢 Branch count updater - counts sub-branches (excludes admin branch)
  async function updateBranchCount() {
    try {
      // Import the isCompanyAdminBranch function
      const { isCompanyAdminBranch } = await import('./js/config.js');
      
      // Fetch branches for the company admin
      const branches = await fetchBranches();
      
      // Count only sub-branches (exclude admin branch)
      const subBranchesCount = branches.filter(branch => 
        !isCompanyAdminBranch(branch, branch.company_id)
      ).length;
      
      // Update the badge
      const badge = document.getElementById("branchCount");
      if (badge) {
        badge.textContent = subBranchesCount.toString();
        badge.style.display = subBranchesCount > 0 ? 'inline-block' : 'none';
      }
      
      console.log(`Branch count updated: ${subBranchesCount} sub-branches found`);
      
    } catch (err) {
        console.error("Branch count error:", err);
        const badge = document.getElementById("branchCount");
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
        
        // If it's an authentication error, just hide the badge
        if (err.code === 401 || err.message.includes("401") || err.message.includes("No Appwrite project")) {
            console.warn("Authentication required or not properly configured.");
            // Don't redirect automatically from topbar, just hide the badge
        }
    }
  }

  // Async function to fetch branches from Appwrite
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
        branch_id: branch.branch_id,
        company_id: branch.company_id,
        branch_name: branch.branch_name || "",
        location: branch.location || "",
        branch_code: branch.branch_code || "",
        is_active: branch.is_active || false
      }));
    } catch (err) {
      console.error("Error fetching branches:", err);
      return [];
    }
  }


  // Run with a small delay to ensure Appwrite client is fully initialized
  setTimeout(() => {
    updateBranchCount();
  }, 100);

  // Expose for manual refresh after add/delete in branches.html
  window.updateBranchCount = updateBranchCount;


// this is when you are to view other branches as admin via workspace.html impersonation


  // 🧭 Role-based visibility + impersonation banner
  try {
    const companyRaw = localStorage.getItem("loggedInCompany");
    const branchRaw = localStorage.getItem("loggedInBranch");
    const company = companyRaw ? JSON.parse(companyRaw) : null;
    const branchSession = branchRaw ? JSON.parse(branchRaw) : null;
    const isBranchManager = !!branchSession; // Branch session exists means branch role

    // Hide entries not available for branch roles
    const hideForBranchSelectors = [
      'a[href="branches.html"]',
      'a[href="account_verification.html"]'
    ];
    if (isBranchManager) {
      hideForBranchSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          const item = el.closest('a, li, .block');
          (item || el).style.display = 'none';
        });
      });
      // Hide branches icon + badge section entirely
      const branchesIconAnchor = document.querySelector('a[href="branches.html"]');
      if (branchesIconAnchor) {
        const container = branchesIconAnchor.closest('.relative') || branchesIconAnchor;
        container.style.display = 'none';
      }
      const branchBadge = document.getElementById("branchCount");
      if (branchBadge) branchBadge.style.display = 'none';
    }

    // For admins (default), leave Branches and Verification enabled.

    // Impersonation UI (admin viewing a branch)
    const asMode = new URLSearchParams(window.location.search).get('as') || localStorage.getItem('impersonateMode');
    const branchName = localStorage.getItem('impersonateBranchName');
    const branchId = new URLSearchParams(window.location.search).get('branchId') || localStorage.getItem('impersonateBranchId');
    const pill = document.getElementById('impersonationPill');
    const pillText = document.getElementById('impersonationText');
    const exitBtn = document.getElementById('exitImpersonationBtn');
    if (pill && asMode === 'admin' && branchId) {
      pill.classList.remove('hidden');
      pillText.textContent = `Viewing as ${branchName || 'Branch'} (Admin)`;
      if (exitBtn) {
        exitBtn.addEventListener('click', () => {
          // Clear impersonation and go back to workspace
          localStorage.removeItem('impersonateBranchId');
          localStorage.removeItem('impersonateBranchName');
          localStorage.removeItem('impersonateMode');
          const url = new URL(window.location.href);
          url.searchParams.delete('branchId');
          url.searchParams.delete('as');
          window.location.href = 'workspace.html';
        });
      }
    }
  } catch (e) {
    console.error('Topbar role/impersonation init error:', e);
  }

  console.log("Topbar init complete");
}
