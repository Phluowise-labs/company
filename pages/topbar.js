console.log("✅ Topbar script loaded");

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

    doConfirm().then((ok) => {
      if (!ok) return;

      // Clear all sessions using RoleUtils if available
      if (window.RoleUtils) {
        RoleUtils.clearAllSessions();
      } else {
        // Fallback to manual clearing
        localStorage.removeItem("authToken");
        localStorage.removeItem("loginToken");
        localStorage.removeItem("otpPurpose");
        localStorage.removeItem("otpToken");
        localStorage.removeItem("otpEmail");
        localStorage.removeItem("loggedInCompany");
        localStorage.removeItem("resendTimeout");
        localStorage.removeItem("phluowise_role");
        localStorage.removeItem("loggedInBranch");
        localStorage.removeItem("branchCode");
        localStorage.removeItem("branchManagerInfo");
      }

      // Redirect
      window.location.href = "user-signin.html";
    });
  };

  // Delegate on the whole document so it always catches the click
  document.addEventListener("click", onLogoutClick, true);

  // 🔢 Branch count updater
 async function updateBranchCount() {
   try {
     const token = localStorage.getItem("authToken");
     const loggedInCompanyData = localStorage.getItem("loggedInCompany");
     const companyData = loggedInCompanyData
       ? JSON.parse(loggedInCompanyData)
       : null;
     const companyId = companyData?.id;

     if (!token || !companyId) {
       console.warn("Missing token or companyId. Branch count not updated.");
       return;
     }

     const baseUrl = "https://phluowise.azurewebsites.net";
     const res = await fetch(
       `${baseUrl}/company-admin/GetBranches/${companyId}`,
       {
         method: "GET",
         headers: { Authorization: `Bearer ${token}` },
       }
     );

     if (!res.ok) {
       console.error("API error:", res.status, res.statusText);
       return;
     }

     const branches = await res.json(); // ✅ response is an array directly
    //  console.log("Fetched branches:", branches);

     const branchCount = Array.isArray(branches) ? branches.length : 0;

     const badge = document.getElementById("branchCount");
     if (badge) {
       badge.textContent = branchCount;
       badge.style.display = branchCount > 0 ? "flex" : "none";
     }
   } catch (err) {
     console.error("Branch count error:", err);
   }
 }


  // Run immediately (no DOMContentLoaded dependency)
  updateBranchCount();

  // Expose for manual refresh after add/delete in branches.html
  window.updateBranchCount = updateBranchCount;

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
