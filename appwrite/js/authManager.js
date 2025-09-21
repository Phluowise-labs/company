import { account, databases, DB_ID, COMPANY_COLL, BRANCH_COLL, Appwrite, isCompanyAdminBranch } from "./config.js";

export class AuthManager {
  constructor() {
    this.user = null;
    this.activeRole = null;
    this.companyId = null;
  }

  async initialize() {
    try {
      // 1️⃣ Get current user
      this.user = await account.get();
      console.log("✅ User loaded:", this.user);

      // 2️⃣ Check if user is a company admin
      const companyDocs = await databases.listDocuments(DB_ID, COMPANY_COLL, [
        Appwrite.Query.equal("company_id", this.user.$id)
      ]);

      // 3️⃣ Check if user is a branch user
      const branchDocs = await databases.listDocuments(DB_ID, BRANCH_COLL, [
        Appwrite.Query.equal("branch_id", this.user.$id)
      ]);

      // 4️⃣ Determine role
      const isCompanyAdmin = companyDocs.total > 0;
      const isBranchUser = branchDocs.total > 0;

      if (!isCompanyAdmin && !isBranchUser) {
        Swal.fire({ icon: "error", title: "Access Error", text: "No matching role found." })
          .then(() => (window.location.href = "signin.html"));
        return;
      }

      // 5️⃣ Determine activeRole and companyId
      if (isCompanyAdmin && isBranchUser) {
        // Both company & branch → default admin
        this.activeRole = "admin";
        this.companyId = companyDocs.documents[0].company_id;
      } else if (isCompanyAdmin) {
        this.activeRole = "admin";
        this.companyId = companyDocs.documents[0].company_id;
      } else if (isBranchUser) {
        const branch = branchDocs.documents[0];
        // If branch_id equals company_id, treat as admin
        this.activeRole = isCompanyAdminBranch(branch, this.user.$id) ? "admin" : "branch";
        this.companyId = branch.company_id;
      }

      // 6️⃣ Determine if user can switch role (company admin with branch access)
      const canSwitchRole = isCompanyAdmin && isBranchUser;

      // 7️⃣ Save to localStorage
      localStorage.setItem("user", JSON.stringify(this.user));
      localStorage.setItem("activeRole", this.activeRole);
      localStorage.setItem("companyId", this.companyId);
      localStorage.setItem("canSwitchRole", canSwitchRole.toString());

      console.log(`[Auth] User=${this.user.name}, Role=${this.activeRole}, Company=${this.companyId}, CanSwitch=${canSwitchRole}`);

    } catch (err) {
      console.error("❌ Auth error:", err);
      window.location.href = "signin.html";
    }
  }
}

// Auto-initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  const auth = new AuthManager();
  await auth.initialize();
});
