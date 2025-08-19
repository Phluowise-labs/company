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

      // Clear login-related storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("loginToken");
      localStorage.removeItem("otpPurpose");
      localStorage.removeItem("otpToken");
      localStorage.removeItem("otpEmail");
      localStorage.removeItem("loggedInCompany");
      localStorage.removeItem("resendTimeout");

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

  console.log("Topbar init complete");
}
