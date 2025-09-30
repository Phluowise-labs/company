// Driver Management Script with Appwrite Integration

// Appwrite configuration (namespaced to avoid conflicts with topbar.js)
const DRIVER_APPWRITE_ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
const DRIVER_APPWRITE_PROJECT = "68b17582003582da69c8";
const DRIVER_DB_ID = "68b1b7590035346a3be9";
const DRIVERS_COLL = "drivers";
const BUCKET_ID = "68b1c57b001542be7fbe"; // Company assets bucket

// Initialize Appwrite client (using CDN version for non-module)
// Wait for Appwrite to be available before initializing
let client, account, databases, storage;

function initializeAppwrite() {
  if (typeof Appwrite === "undefined") {
    console.error("Appwrite SDK not loaded yet");
    return false;
  }

  client = new Appwrite.Client()
    .setEndpoint(DRIVER_APPWRITE_ENDPOINT)
    .setProject(DRIVER_APPWRITE_PROJECT);

  account = new Appwrite.Account(client);
  databases = new Appwrite.Databases(client);
  storage = new Appwrite.Storage(client);

  console.log("Appwrite initialized successfully for drivers");
  return true;
}

// Global variables
let drivers = [];
let editingDriverId = null;
let currentCompanyId = null;
let currentBranchId = null;

// Generate a unique ID for drivers
function generateDriverId() {
  return "DRV-" + Math.floor(100000 + Math.random() * 900000);
}

// Upload image to Appwrite Storage
async function uploadImageToAppwrite(file, imageType, driverId, branchId) {
  try {
    // Compress image if it's too large (> 1MB)
    let processedFile = file;
    if (file.size > 1024 * 1024) {
      processedFile = await compressImage(file, 0.8);
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();

    // Generate a valid fileId that includes both driver ID and branch ID for easy identification
    const shortDriverId = driverId.substring(0, 6);
    const shortBranchId = branchId ? branchId.substring(0, 6) : "nobranch";
    const shortTimestamp = timestamp.toString().slice(-6);
    const fileName = `driver_${imageType}_${shortDriverId}_${shortBranchId}_${shortTimestamp}.${fileExtension}`;

    // Ensure fileName is within 36 character limit
    const finalFileName =
      fileName.length > 36
        ? `drv_${imageType}_${shortDriverId}_${shortBranchId}_${shortTimestamp}.${fileExtension}`.substring(
            0,
            36
          )
        : fileName;

    const result = await storage.createFile(
      BUCKET_ID,
      finalFileName,
      processedFile
    );

    // Get file URL
    const fileUrl = storage.getFileView(BUCKET_ID, result.$id);
    return fileUrl;
  } catch (error) {
    console.error(`Error uploading ${imageType} image:`, error);
    throw error;
  }
}

// Compress image function
async function compressImage(file, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions (max 800px width/height)
      const maxSize = 800;
      let { width, height } = img;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          // Convert blob to File object with proper name and type
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

// Get current user context (company and branch IDs)
async function getCurrentUserContext() {
  try {
    const user = await account.get();

    // Simply get the branch information for the logged-in user
    const branchDocs = await databases.listDocuments(DRIVER_DB_ID, "branches", [
      Appwrite.Query.equal("email", user.email),
    ]);

    if (branchDocs.documents.length > 0) {
      const branch = branchDocs.documents[0];
      currentCompanyId = branch.company_id;
      currentBranchId = branch.branch_id;

      // Cache the values for offline use
      localStorage.setItem("cachedCompanyId", currentCompanyId);
      localStorage.setItem("cachedBranchId", currentBranchId);

      console.log("User context loaded successfully:", {
        currentCompanyId,
        currentBranchId,
      });
    } else {
      console.warn("No branch found for user email:", user.email);
    }
  } catch (error) {
    console.error("Error getting user context:", error);

    // Use cached values as fallback
    const cachedCompanyId = localStorage.getItem("cachedCompanyId");
    const cachedBranchId = localStorage.getItem("cachedBranchId");

    if (cachedCompanyId && cachedBranchId) {
      currentCompanyId = cachedCompanyId;
      currentBranchId = cachedBranchId;
      console.log("Using cached user context:", {
        currentCompanyId,
        currentBranchId,
      });
    }
  }
}

// Load drivers from Appwrite
async function loadDriversFromAppwrite() {
  try {
    await getCurrentUserContext();

    if (!currentBranchId) {
      console.error("No branch ID found");
      // Try to get branch ID from URL parameters or localStorage as fallback
      const urlParams = new URLSearchParams(window.location.search);
      const branchIdFromUrl = urlParams.get("branchId");
      const branchIdFromStorage = localStorage.getItem("impersonateBranchId");
      const cachedBranchId = localStorage.getItem("cachedBranchId");

      if (branchIdFromUrl) {
        currentBranchId = branchIdFromUrl;
        console.log("Using branch ID from URL:", currentBranchId);
      } else if (branchIdFromStorage) {
        currentBranchId = branchIdFromStorage;
        console.log("Using branch ID from localStorage:", currentBranchId);
      } else if (cachedBranchId) {
        currentBranchId = cachedBranchId;
        console.log("Using cached branch ID:", currentBranchId);
      } else {
        console.error("No branch ID available from any source");
        // Show user-friendly error message
        const driversList = document.querySelector(".drivers-list");
        if (driversList) {
          driversList.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 20px; color: #e74c3c;">
              <h3>Unable to Load Drivers</h3>
              <p>Network connection issue or missing branch information.</p>
              <p>Please check your internet connection and try refreshing the page.</p>
              <button onclick="location.reload()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Refresh Page
              </button>
            </div>
          `;
        }
        return;
      }
    }

    // Cache the branch ID for future use
    if (currentBranchId) {
      localStorage.setItem("cachedBranchId", currentBranchId);
    }
    if (currentCompanyId) {
      localStorage.setItem("cachedCompanyId", currentCompanyId);
    }

    const response = await databases.listDocuments(DRIVER_DB_ID, DRIVERS_COLL, [
      Appwrite.Query.equal("branch_id", currentBranchId),
      Appwrite.Query.orderDesc("$createdAt"),
    ]);

    drivers = response.documents.map((driver) => ({
      ...driver,
      // Convert Appwrite URLs to display URLs if they exist
      profileImage: driver.profileImage
        ? driver.profileImage.startsWith("http")
          ? driver.profileImage
          : storage.getFileView(BUCKET_ID, driver.profileImage)
        : "",
      frontIdImage: driver.frontIdImage
        ? driver.frontIdImage.startsWith("http")
          ? driver.frontIdImage
          : storage.getFileView(BUCKET_ID, driver.frontIdImage)
        : "",
      backIdImage: driver.backIdImage
        ? driver.backIdImage.startsWith("http")
          ? driver.backIdImage
          : storage.getFileView(BUCKET_ID, driver.backIdImage)
        : "",
    }));

    renderDriversList();
    hideLoadingModal();
  } catch (error) {
    console.error("Error loading drivers:", error);
    hideLoadingModal();
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to load drivers. Please refresh the page.",
    });
  }
}

// Format driver data from form
function getDriverData() {
  return {
    driver_id: document.getElementById("driverID").value, // Map Driver's ID Number to driver_id column
    publicName: document.getElementById("publicName").value,
    name: document.getElementById("driverName").value, // Name of driver goes to "name" column
    phoneNumber: document.getElementById("phoneNumber").value,
    emailAddress: document.getElementById("emailAddress").value,
    residence: document.getElementById("residence").value,
    vehicleNumber: document.getElementById("vehicleNumber").value,
    vehicleType: document.getElementById("vehicleType").value,
    id_type: document.getElementById("idType").value,
    idNumber: document.getElementById("idNumber").value,
    status: "offline", // Default status
    company_id: currentCompanyId,
    branch_id: currentBranchId,
    created_at: new Date().toISOString(), // Add timestamp when driver record is created
  };
}

// Save driver to Appwrite
async function saveDriverToAppwrite(
  driverData,
  profileImageFile,
  frontIdFile,
  backIdFile
) {
  try {
    let result;

    // Upload images if provided and store URLs in proper database columns
    if (profileImageFile) {
      driverData.profile_image = await uploadImageToAppwrite(
        profileImageFile,
        "profile",
        driverData.driver_id,
        currentBranchId
      );
    }
    if (frontIdFile) {
      driverData.ID_Document_Images_Front = await uploadImageToAppwrite(
        frontIdFile,
        "front_id",
        driverData.driver_id,
        currentBranchId
      );
    }
    if (backIdFile) {
      driverData.ID_Document_Images_Back = await uploadImageToAppwrite(
        backIdFile,
        "back_id",
        driverData.driver_id,
        currentBranchId
      );
    }

    if (editingDriverId) {
      // Update existing driver
      const existingDriver = drivers.find(
        (d) => d.driver_id === editingDriverId
      );
      if (existingDriver) {
        // Keep existing images if no new ones uploaded
        if (!profileImageFile && existingDriver.profile_image) {
          driverData.profile_image = existingDriver.profile_image;
        }
        if (!frontIdFile && existingDriver.ID_Document_Images_Front) {
          driverData.ID_Document_Images_Front =
            existingDriver.ID_Document_Images_Front;
        }
        if (!backIdFile && existingDriver.ID_Document_Images_Back) {
          driverData.ID_Document_Images_Back =
            existingDriver.ID_Document_Images_Back;
        }

        result = await databases.updateDocument(
          DRIVER_DB_ID,
          DRIVERS_COLL,
          existingDriver.$id,
          driverData
        );
      }
    } else {
      // Create new driver
      result = await databases.createDocument(
        DRIVER_DB_ID,
        DRIVERS_COLL,
        Appwrite.ID.unique(),
        driverData
      );
    }

    return result;
  } catch (error) {
    console.error("Error saving driver to Appwrite:", error);
    throw error;
  }
}

// Reset form
function resetForm() {
  try {
    // Clear all form inputs
    const inputs = document.querySelectorAll(
      "#driverForm input[type='text'], #driverForm input[type='email'], #driverForm input[type='tel'], #driverForm input[type='hidden'], #driverForm textarea, #driverForm select"
    );
    inputs.forEach((input) => {
      if (input.tagName.toLowerCase() === "select") {
        input.selectedIndex = 0;
      } else {
        input.value = "";
      }
    });

    // Reset image previews
    ["previewImage", "frontIdPreview", "backIdPreview"].forEach((id) => {
      const img = document.getElementById(id);
      if (img) {
        img.src = "";
        img.style.display = "none";
      }
    });

    // Reset placeholders/icons
    document.querySelector(".image-upload p").style.display = "block";
    document.querySelector("#frontIdUpload .upload-icon").style.display =
      "block";
    document.querySelector("#frontIdUpload p").style.display = "block";
    document.querySelector("#backIdUpload .upload-icon").style.display =
      "block";
    document.querySelector("#backIdUpload p").style.display = "block";

    // Reset form state
    editingDriverId = null;
    document.getElementById("driverId").value = "";

    // Reset button UI
    const addButton = document.getElementById("addDriver");
    const cancelButton = document.getElementById("cancelEdit");
    if (addButton) {
      addButton.textContent = "Add Driver";
      addButton.style.background = "var(--primary)";
    }
    if (cancelButton) {
      cancelButton.style.display = "none";
    }

    // Clear file inputs
    ["profileImage", "frontIdImage", "backIdImage"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });
  } catch (error) {
    console.error("Error resetting form:", error);
  }
}

// Save driver (add or update)
async function saveDriver() {
  try {
    const driverData = getDriverData();

    // Validate required fields
    if (
      !driverData.name ||
      !driverData.phoneNumber ||
      !driverData.vehicleNumber
    ) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in all required fields (Name, Phone Number, Vehicle Number).",
      });
      return;
    }

    // Get uploaded files
    const profileImageFile = document.getElementById("profileImage").files[0];
    const frontIdFile = document.getElementById("frontIdImage").files[0];
    const backIdFile = document.getElementById("backIdImage").files[0];

    // Show loading
    Swal.fire({
      title: "Saving Driver...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Save to Appwrite
    await saveDriverToAppwrite(
      driverData,
      profileImageFile,
      frontIdFile,
      backIdFile
    );

    // Reload drivers list
    await loadDriversFromAppwrite();

    // Show success message
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: `Driver ${editingDriverId ? "updated" : "added"} successfully`,
      timer: 2000,
      showConfirmButton: false,
    });

    // Reset the form
    setTimeout(() => {
      resetForm();
    }, 1000);
  } catch (error) {
    console.error("Error saving driver:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to save driver. Please try again.",
    });
  }
}

// Delete driver from Appwrite
async function deleteDriverFromAppwrite(driverId) {
  try {
    const driver = drivers.find((d) => d.driver_id === driverId);
    if (driver && driver.$id) {
      await databases.deleteDocument(DRIVER_DB_ID, DRIVERS_COLL, driver.$id);
    }
  } catch (error) {
    console.error("Error deleting driver from Appwrite:", error);
    throw error;
  }
}

// Delete driver
function deleteDriver(driverId) {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Show loading
        Swal.fire({
          title: "Deleting Driver...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await deleteDriverFromAppwrite(driverId);
        await loadDriversFromAppwrite();

        Swal.fire("Deleted!", "Driver has been deleted.", "success");
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete driver. Please try again.",
        });
      }
    }
  });
}

// Populate form for editing
function editDriver(driverId) {
  const driver = drivers.find((d) => d.driver_id === driverId);
  if (!driver) return;

  editingDriverId = driverId;

  // Set form values
  document.getElementById("driverId").value = driver.driver_id;
  document.getElementById("publicName").value = driver.publicName || "";
  document.getElementById("driverName").value = driver.name || "";
  document.getElementById("phoneNumber").value = driver.phoneNumber || "";
  document.getElementById("emailAddress").value = driver.emailAddress || "";
  document.getElementById("residence").value = driver.residence || "";
  document.getElementById("vehicleNumber").value = driver.vehicleNumber || "";
  document.getElementById("vehicleType").value = driver.vehicleType || "";
  document.getElementById("driverID").value = driver.driver_id || ""; // Use driver_id field
  document.getElementById("idType").value = driver.id_type || ""; // Use id_type field
  document.getElementById("idNumber").value = driver.idNumber || "";

  // Set images if they exist (using updated column names)
  const previewImage = document.getElementById("previewImage");
  const frontIdPreview = document.getElementById("frontIdPreview");
  const backIdPreview = document.getElementById("backIdPreview");

  if (driver.profile_image) {
    previewImage.src = driver.profile_image;
    previewImage.style.display = "block";
    document.querySelector(".image-upload p").style.display = "none";
  }

  if (driver.ID_Document_Images_Front) {
    frontIdPreview.src = driver.ID_Document_Images_Front;
    frontIdPreview.style.display = "block";
    document.querySelector("#frontIdUpload .upload-icon").style.display =
      "none";
    document.querySelector("#frontIdUpload p").style.display = "none";
  }

  if (driver.ID_Document_Images_Back) {
    backIdPreview.src = driver.ID_Document_Images_Back;
    backIdPreview.style.display = "block";
    document.querySelector("#backIdUpload .upload-icon").style.display = "none";
    document.querySelector("#backIdUpload p").style.display = "none";
  }

  // Update button text and show cancel button
  const addButton = document.getElementById("addDriver");
  const cancelButton = document.getElementById("cancelEdit");
  addButton.textContent = "Update Driver";
  addButton.style.background = "var(--warning)";
  cancelButton.style.display = "block";

  // Scroll to form
  document
    .querySelector(".form-container")
    .scrollIntoView({ behavior: "smooth" });
}

// Render drivers list
function renderDriversList() {
  const driversList = document.querySelector(".drivers-list");
  driversList.innerHTML = '<h2 class="list-title">List of Drivers</h2>';

  if (drivers.length === 0) {
    driversList.innerHTML += '<p class="no-drivers">No drivers added yet</p>';
    return;
  }

  drivers.forEach((driver) => {
    const driverCard = document.createElement("div");
    driverCard.className = "driver-card";

    // Status indicator
    const statusClass =
      driver.status === "online" ? "text-green-400" : "text-gray-400";
    const statusText = driver.status === "online" ? "Online" : "Offline";

    driverCard.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h3>${driver.name || "Unnamed Driver"}</h3>
        <span class="${statusClass} text-sm font-medium">${statusText}</span>
      </div>
      <p>Public Name: <span>${driver.publicName || "N/A"}</span></p>
      <p>Phone: <span>${driver.phoneNumber || "N/A"}</span></p>
      <p>Vehicle: <span>${driver.vehicleNumber || "N/A"} (${
      driver.vehicleType || "N/A"
    })</span></p>
      <p>ID: <span>${driver.driver_id || "N/A"}</span></p>
      <p>Location: <span>${driver.residence || "N/A"}</span></p>
      <div class="driver-actions">
        <button class="btn-edit" onclick="editDriver('${driver.driver_id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn-delete" onclick="deleteDriver('${
          driver.driver_id
        }')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    driversList.appendChild(driverCard);
  });
}

// Initialize the application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  showLoadingModal();

  // Initialize Appwrite first
  if (!initializeAppwrite()) {
    console.error("Failed to initialize Appwrite");
    hideLoadingModal();
    return;
  }

  // Load drivers from Appwrite on page load
  loadDriversFromAppwrite();

  // Set up cancel button with event delegation
  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "cancelEdit") {
      e.preventDefault();
      resetForm();
    }
  });

  // Image preview handlers
  document
    .getElementById("profileImage")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const previewImage = document.getElementById("previewImage");
          previewImage.src = e.target.result;
          previewImage.style.display = "block";
          document.querySelector(".image-upload p").style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });

  document
    .getElementById("frontIdImage")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const previewImage = document.getElementById("frontIdPreview");
          previewImage.src = e.target.result;
          previewImage.style.display = "block";
          document.querySelector("#frontIdUpload .upload-icon").style.display =
            "none";
          document.querySelector("#frontIdUpload p").style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });

  document
    .getElementById("backIdImage")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const previewImage = document.getElementById("backIdPreview");
          previewImage.src = e.target.result;
          previewImage.style.display = "block";
          document.querySelector("#backIdUpload .upload-icon").style.display =
            "none";
          document.querySelector("#backIdUpload p").style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });

  // Generate ID button
  document.getElementById("generateID").addEventListener("click", function () {
    const generatedId = generateDriverId();
    document.getElementById("driverID").value = generatedId;

    Swal.fire({
      icon: "success",
      title: "ID Generated!",
      text: `Generated ID: ${generatedId}`,
      timer: 2000,
      showConfirmButton: false,
    });
  });

  // Add ID Type dialog handlers
  const addIdTypeBtn = document.getElementById("addIdType");
  const addIdTypeDialog = document.getElementById("addIdTypeDialog");
  const cancelAddIdTypeBtn = document.getElementById("cancelAddIdType");
  const saveIdTypeBtn = document.getElementById("saveIdType");

  addIdTypeBtn.addEventListener("click", function () {
    addIdTypeDialog.style.display = "flex";
  });

  cancelAddIdTypeBtn.addEventListener("click", function () {
    addIdTypeDialog.style.display = "none";
  });

  saveIdTypeBtn.addEventListener("click", function () {
    const newIdType = document.getElementById("newIdType").value.trim();
    if (newIdType) {
      const idTypeSelect = document.getElementById("idType");
      const option = document.createElement("option");
      option.value = newIdType.toLowerCase().replace(/\s+/g, "_");
      option.textContent = newIdType;
      idTypeSelect.appendChild(option);
      idTypeSelect.value = option.value;

      document.getElementById("newIdType").value = "";
      addIdTypeDialog.style.display = "none";

      Swal.fire({
        icon: "success",
        title: "ID Type Added!",
        text: `${newIdType} has been added to the list.`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  });

  // Add Driver button
  document.getElementById("addDriver").addEventListener("click", function (e) {
    e.preventDefault();
    saveDriver();
  });
});

// Loading modal helper functions
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
