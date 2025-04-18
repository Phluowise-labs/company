const baseUrl = "https://phlowise-amggdaagb5ancjfu.eastus-01.azurewebsites.net";

document.getElementById("addBranchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("authToken");
  const companyId = JSON.parse(localStorage.getItem("loggedInCompany"))?.companyId;

  if (!token || !companyId) {
    return Swal.fire("Unauthorized", "Please log in as a company admin first.", "warning");
  }


  const branchCode = generateBranchCode();
  

  const branchData = {
    branchName: document.getElementById("branchName").value,
    branchEmail: null,
    branchPhoneNumber: null,
    branchLocation: document.getElementById("branchLocation").value,
    branchPassword: document.getElementById("branchPassword").value,
    branchCode,
    companyId,
  };

  try {
    const response = await fetch(`${baseUrl}/company-admin/AddBranch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(branchData),
    });

    const result = await response.json();
    console.log("Add Branch Response:", result);

    if (response.ok) {
      Swal.fire("Success", "Branch added successfully!", "success");
      document.getElementById("addBranchForm").reset();
    } else {
      Swal.fire("Error", result.message || "Failed to add branch.", "error");
    }
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
});

function generateBranchCode() {
  const company = JSON.parse(localStorage.getItem("loggedInCompany"));
  const name = company?.companyName?.substring(0, 3).toUpperCase() || "COM";
  const branch = document.getElementById("branchName").value.substring(0, 4).toUpperCase();
  const loc = document.getElementById("branchLocation").value.substring(0, 3).toUpperCase();
  const unique = Math.floor(1000 + Math.random() * 9000);
  return `${name}-${branch}-${loc}-${unique}`;
}
