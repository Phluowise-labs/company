// =============================
// Appwrite SDK Import
// =============================
import { Client, Account, Databases, Storage, Query, Permission, Role, ID } from "https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm";

// =============================
// Appwrite Configuration
// =============================
const APPWRITE_ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
const APPWRITE_PROJECT = "68b17582003582da69c8";
const DB_ID = "68b1b7590035346a3be9";
const BRANCHES_COLL = "branches"; // Changed to branches table
const WORKING_DAYS_COLL = "working_days"; // Working days table
const SOCIAL_MEDIA_COLL = "social_media"; // Social media table
const BUCKET_ID = "68b1c57b001542be7fbe"; // Updated bucket ID

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// =============================
// Appwrite Functions
// =============================

// Upload file to Appwrite Storage
async function uploadFileToAppwrite(file, fileType, companyId) {
  try {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    
    // Generate a valid fileId that meets Appwrite requirements:
    // - Max 36 characters
    // - Only a-z, A-Z, 0-9, period, hyphen, and underscore
    // - Can't start with special char
    const shortCompanyId = companyId.substring(0, 8); // Take first 8 chars of company ID
    const shortTimestamp = timestamp.toString().slice(-8); // Take last 8 digits of timestamp
    const fileName = `${fileType}_${shortCompanyId}_${shortTimestamp}.${fileExtension}`;
    
    // Ensure fileName is within 36 character limit
    const finalFileName = fileName.length > 36 ? 
      `${fileType}_${shortTimestamp}.${fileExtension}`.substring(0, 36) : 
      fileName;
    
    const result = await storage.createFile(
      BUCKET_ID,
      finalFileName,
      file,
      [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );
    
    // Get file URL
    const fileUrl = storage.getFileView(BUCKET_ID, result.$id);
    return fileUrl;
  } catch (error) {
    console.error(`Error uploading ${fileType}:`, error);
    throw error;
  }
}

// Load branch profile from Appwrite
async function loadBranchProfileFromAppwrite() {
  try {
    const user = await account.get();
    const companyId = user.$id;

    // First get the branch_id for this company
    const branchResult = await databases.listDocuments(
      DB_ID,
      BRANCHES_COLL,
      [Query.equal("company_id", companyId)]
    );

    if (branchResult.documents.length === 0) {
      return null;
    }

    const branchId = branchResult.documents[0].branch_id;

    // Load branch profile using branch_id
    const result = await databases.listDocuments(
      DB_ID,
      BRANCHES_COLL,
      [Query.equal("branch_id", branchId)]
    );

    if (result.documents.length > 0) {
      const branch = result.documents[0];
      return {
        branchName: branch.branch_name || "",
        branchCode: branch.branch_code || "",
        branchType: branch.branch_type || "",
        description: branch.description || "",
        location: branch.location || "",
        email: branch.email || "",
        phoneNumber: branch.phone_number || "",
        website: branch.website || "",
        isActive: branch.is_active || false,
        isOnline: branch.is_online || false,
        branchId: branch.branch_id,
        companyId: branch.company_id,
        headerImage: branch.header_image || "",
        profileImage: branch.profile_image || ""
      };
    }

    return null;
  } catch (error) {
    console.error("Error loading branch profile from Appwrite:", error);
    return null;
  }
}

// Save branch profile to Appwrite
async function saveBranchProfileToAppwrite(branchData) {
  try {
    const user = await account.get();
    const companyId = user.$id;

    // Check if branch document exists to determine if this is admin or branch type
    const existingDocs = await databases.listDocuments(
      DB_ID,
      BRANCHES_COLL,
      [Query.equal("company_id", companyId)]
    );

    let branchId, branchType;
    
    if (existingDocs.documents.length > 0) {
      // Use existing branch_id
      branchId = existingDocs.documents[0].branch_id;
    } else {
      // Generate unique branch_id for new branch
      branchId = ID.unique();
    }

    // Determine branch type based on branch_id == company_id
    // If branch_id equals company_id, it's admin type, otherwise it's branch type
    branchType = branchId === companyId ? "admin" : "branch";

    // Prepare document data according to branches table schema
    const documentData = {
      branch_name: branchData.branchName,
      branch_code: branchData.branchCode,
      branch_type: branchType, // Auto-determined based on role logic
      email: branchData.email,
      location: branchData.location,
      description: branchData.description,
      phone_number: branchData.phoneNumber,
      website: branchData.website,
      is_active: branchData.isActive !== undefined ? branchData.isActive : true,
      is_online: branchData.isOnline !== undefined ? branchData.isOnline : false,
      company_id: companyId,
      branch_id: branchId
    };

    let result;
    if (existingDocs.documents.length > 0) {
      // Update existing document using branch_id
      const branchDoc = await databases.listDocuments(
        DB_ID,
        BRANCHES_COLL,
        [Query.equal("branch_id", branchId)]
      );
      
      if (branchDoc.documents.length > 0) {
        result = await databases.updateDocument(
          DB_ID,
          BRANCHES_COLL,
          branchDoc.documents[0].$id,
          documentData
        );
      } else {
        // Create new document if not found by branch_id
        result = await databases.createDocument(
          DB_ID,
          BRANCHES_COLL,
          ID.unique(),
          documentData
        );
      }
    } else {
      // Create new document
      result = await databases.createDocument(
        DB_ID,
        BRANCHES_COLL,
        ID.unique(),
        documentData
      );
    }

    return { ...result, branchId, companyId };
  } catch (error) {
    console.error("Error saving branch profile to Appwrite:", error);
    throw error;
  }
}

// Load working days from Appwrite
async function loadWorkingDaysFromAppwrite() {
  try {
    const user = await account.get();
    const companyId = user.$id;

    // First get the branch_id for this company
    const branchResult = await databases.listDocuments(
      DB_ID,
      BRANCHES_COLL,
      [Query.equal("company_id", companyId)]
    );

    if (branchResult.documents.length === 0) {
      return [];
    }

    const branchId = branchResult.documents[0].branch_id;

    // Load working days using branch_id
    const result = await databases.listDocuments(
      DB_ID,
      WORKING_DAYS_COLL,
      [Query.equal("branch_id", branchId)]
    );

    return result.documents.map(doc => ({
      day: doc.day,
      time: doc.time,
      company_id: doc.company_id,
      branch_id: doc.branch_id
    }));
  } catch (error) {
    console.error("Error loading working days from Appwrite:", error);
    return [];
  }
}

// Save working days to Appwrite
async function saveWorkingDaysToAppwrite(workingDaysData, branchId, companyId) {
  try {
    if (!branchId || !companyId) {
      throw new Error("Branch ID and Company ID are required");
    }

    // Get existing working days for this branch
    const existingDocs = await databases.listDocuments(
      DB_ID,
      WORKING_DAYS_COLL,
      [Query.equal("branch_id", branchId)]
    );

    // Delete existing working days
    for (const doc of existingDocs.documents) {
      await databases.deleteDocument(DB_ID, WORKING_DAYS_COLL, doc.$id);
    }

    // Create new working days entries
    const results = [];
    for (const dayData of workingDaysData) {
      if (dayData.day && dayData.time) {
        const result = await databases.createDocument(
          DB_ID,
          WORKING_DAYS_COLL,
          ID.unique(),
          {
            day: dayData.day,
            time: dayData.time,
            company_id: companyId,
            branch_id: branchId
          }
        );
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error("Error saving working days to Appwrite:", error);
    throw error;
  }
}

// Load social media from Appwrite
async function loadSocialMediaFromAppwrite() {
  try {
    const user = await account.get();
    const companyId = user.$id;

    // First get the branch_id for this company
    const branchResult = await databases.listDocuments(
      DB_ID,
      BRANCHES_COLL,
      [Query.equal("company_id", companyId)]
    );

    if (branchResult.documents.length === 0) {
      return null;
    }

    const branchId = branchResult.documents[0].branch_id;

    // Load social media using branch_id
    const result = await databases.listDocuments(
      DB_ID,
      SOCIAL_MEDIA_COLL,
      [Query.equal("branch_id", branchId)]
    );

    if (result.documents.length > 0) {
      const socialMedia = result.documents[0];
      return {
        whatsapp: socialMedia.whatsapp || "",
        twitter: socialMedia.twitter || "",
        facebook: socialMedia.facebook || "",
        linkedin: socialMedia.linkedIn || "",
        instagram: socialMedia.instagram || "",
        discord: socialMedia.discord || ""
      };
    }

    return null;
  } catch (error) {
    console.error("Error loading social media from Appwrite:", error);
    return null;
  }
}

// Save social media to Appwrite
async function saveSocialMediaToAppwrite(socialMediaData, branchId, companyId) {
  try {
    if (!branchId || !companyId) {
      throw new Error("Branch ID and Company ID are required");
    }

    // Get existing social media for this branch
    const existingDocs = await databases.listDocuments(
      DB_ID,
      SOCIAL_MEDIA_COLL,
      [Query.equal("branch_id", branchId)]
    );

    // Prepare social media data
    const socialMediaDocument = {
      whatsapp: sanitizeInput(socialMediaData.whatsapp || ""),
      twitter: sanitizeInput(socialMediaData.twitter || ""),
      facebook: sanitizeInput(socialMediaData.facebook || ""),
      linkedIn: sanitizeInput(socialMediaData.linkedin || ""),
      instagram: sanitizeInput(socialMediaData.instagram || ""),
      discord: sanitizeInput(socialMediaData.discord || ""),
      company_id: companyId,
      branch_id: branchId
    };

    let result;
    if (existingDocs.documents.length > 0) {
      // Update existing social media document
      result = await databases.updateDocument(
        DB_ID,
        SOCIAL_MEDIA_COLL,
        existingDocs.documents[0].$id,
        socialMediaDocument
      );
    } else {
      // Create new social media document
      result = await databases.createDocument(
        DB_ID,
        SOCIAL_MEDIA_COLL,
        ID.unique(),
        socialMediaDocument
      );
    }

    return result;
  } catch (error) {
    console.error("Error saving social media to Appwrite:", error);
    throw error;
  }
}

// =============================
// Utility Functions
// =============================

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}


// Removed getSocialHandles function as it's not needed for branches table

// Removed getworkingDays function as it's not needed for branches table

function sanitizeInput(input) {
  if (!input) return "";
  let sanitized = String(input).replace(/<[^>]*>?/gm, ""); // strip HTML
  const blacklist =
    /(\b(SELECT|UPDATE|DELETE|INSERT|DROP|ALTER|CREATE|TRUNCATE)\b|['";])/gi;
  sanitized = sanitized.replace(blacklist, "");
  return sanitized.trim();
}

// Get working days data from Alpine.js component
function getWorkingDaysData() {
  try {
    // Access Alpine.js data from the working days component
    const workingDaysElement = document.querySelector('[x-data*="workingDays"]');
    if (!workingDaysElement) return [];
    
    // Get the Alpine.js component instance
    const alpineData = Alpine.$data(workingDaysElement);
    if (!alpineData || !alpineData.workingDays) return [];
    
    // Format the data for the working_days table
    return alpineData.workingDays.map(day => ({
      day: sanitizeInput(day.day),
      time: sanitizeInput(`${day.open}-${day.close}`), // Combine open and close times
      branch_id: null // Will be set in saveWorkingDaysToAppwrite
    })).filter(day => day.day && day.time && day.time !== '-');
  } catch (error) {
    console.error("Error getting working days data:", error);
    return [];
  }
}

// Get social media data from form
function getSocialMediaData() {
  return {
    whatsapp: getValue("social-whatsapp") || getValue("Whatsapp") || "",
    twitter: getValue("social-twitter") || getValue("Twitter") || "",
    facebook: getValue("social-facebook") || getValue("Facebook") || "",
    linkedin: getValue("social-linkedin") || getValue("LinkedIn") || "",
    instagram: getValue("social-instagram") || getValue("Instagram") || "",
    discord: getValue("social-discord") || getValue("Discord") || ""
  };
}

// Get image files from form inputs
function getImageFiles() {
  const headerFile = document.getElementById("header-upload")?.files?.[0];
  const profileFile = document.getElementById("profile-upload")?.files?.[0];
  
  return {
    headerFile,
    profileFile
  };
}

// Upload images to Appwrite Storage
async function uploadImagesToAppwrite(branchId, companyId) {
  const { headerFile, profileFile } = getImageFiles();
  const uploadedImages = {};

  try {
    // Upload header image if provided
    if (headerFile) {
      const headerUrl = await uploadFileToAppwrite(headerFile, `header_${branchId}`, companyId);
      uploadedImages.headerImage = headerUrl;
      console.log("✅ Header image uploaded:", headerUrl);
    }

    // Upload profile/logo image if provided
    if (profileFile) {
      const profileUrl = await uploadFileToAppwrite(profileFile, `profile_${branchId}`, companyId);
      uploadedImages.profileImage = profileUrl;
      console.log("✅ Profile image uploaded:", profileUrl);
    }

    return uploadedImages;
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
}

function validateBranchData(data) {
  const errors = [];
  const phonePattern = /^[0-9]{10,15}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Required checks based on branches table schema
  if (!data.branchName) errors.push("Branch name is required.");
  else if (data.branchName.length > 30)
    errors.push("Branch name must be less than 30 characters.");

  if (!data.email) errors.push("Email is required.");
  else if (!emailPattern.test(data.email))
    errors.push("Please enter a valid email address.");

  if (data.branchCode && data.branchCode.length > 30)
    errors.push("Branch code must be less than 30 characters.");

  if (data.description && data.description.length > 200)
    errors.push("Description must be less than 200 characters.");

  if (data.location && data.location.length > 30)
    errors.push("Location must be less than 30 characters.");

  if (data.phoneNumber && !phonePattern.test(data.phoneNumber))
    errors.push("Please enter a valid phone number (10-15 digits).");

  // Enhanced website validation to handle multiple URL formats
  if (data.website && data.website.trim() !== "") {
    const website = data.website.trim();
    
    // Check length first
    if (website.length > 70) {
      errors.push("Website must be less than 70 characters.");
    } else {
      // Normalize the website URL for validation
      let normalizedUrl = website;
      
      // Add protocol if missing
      if (!website.startsWith('http://') && !website.startsWith('https://')) {
        normalizedUrl = 'https://' + website;
      }
      
      // Validate the normalized URL
      try {
        const url = new URL(normalizedUrl);
        
        // Check if it's a valid domain format
        const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!domainPattern.test(url.hostname)) {
          errors.push("Please enter a valid website URL (e.g., abc.com, www.abc.com, https://abc.com)");
        }
        
        // Update the data with normalized URL for storage
        data.website = normalizedUrl;
        
      } catch (error) {
        errors.push("Please enter a valid website URL (e.g., abc.com, www.abc.com, https://abc.com)");
      }
    }
  }

  // Sanitize all inputs (branch_type is auto-determined, so no need to sanitize)
  data.branchName = sanitizeInput(data.branchName);
  data.branchCode = sanitizeInput(data.branchCode);
  data.description = sanitizeInput(data.description);
  data.location = sanitizeInput(data.location);
  data.email = sanitizeInput(data.email);
  data.website = sanitizeInput(data.website);

  return errors;
}

async function base64ToFile(base64String, filename) {
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 string format");
  }
  const type = matches[1];
  const base64Data = matches[2];
  const byteCharacters = atob(base64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  const blob = new Blob(byteArrays, { type });
  return new File([blob], filename, { type });
}

// =============================
// Main Application Logic
// =============================

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");
  if (!form) return;

  // Load branch data from Appwrite
  try {
    const branchData = await loadBranchProfileFromAppwrite();
    if (branchData) {
      // Populate form fields - mapping branches table data to original form fields
      document.getElementById("company-name").value = branchData.branchName || "";
      document.getElementById("description").value = branchData.description || "";
      document.getElementById("location").value = branchData.location || "";
      document.getElementById("email").value = branchData.email || "";
      document.getElementById("phone").value = branchData.phoneNumber || "";
      document.getElementById("website").value = branchData.website || "";
    }

    // Load working days from Appwrite
    const workingDays = await loadWorkingDaysFromAppwrite();
    if (workingDays.length > 0) {
      // Populate Alpine.js working days component
      const workingDaysElement = document.querySelector('[x-data*="workingDays"]');
      if (workingDaysElement) {
        const alpineData = Alpine.$data(workingDaysElement);
        if (alpineData) {
          alpineData.workingDays = workingDays.map(day => {
            const [open, close] = day.time.split('-');
            return {
              day: day.day,
              open: open || '',
              close: close || ''
            };
          });
        }
      }
    }

    // Load social media from Appwrite
    const socialMedia = await loadSocialMediaFromAppwrite();
    if (socialMedia) {
      // Populate social media form fields (using the actual field names from HTML)
      const whatsappField = document.getElementById("social-whatsapp") || document.querySelector('input[name="Whatsapp"]');
      const twitterField = document.getElementById("social-twitter") || document.querySelector('input[name="Twitter"]');
      const facebookField = document.getElementById("social-facebook") || document.querySelector('input[name="Facebook"]');
      const linkedinField = document.getElementById("social-linkedin") || document.querySelector('input[name="LinkedIn"]');
      const instagramField = document.getElementById("social-instagram") || document.querySelector('input[name="Instagram"]');
      const discordField = document.getElementById("social-discord") || document.querySelector('input[name="Discord"]');

      if (whatsappField) whatsappField.value = socialMedia.whatsapp || "";
      if (twitterField) twitterField.value = socialMedia.twitter || "";
      if (facebookField) facebookField.value = socialMedia.facebook || "";
      if (linkedinField) linkedinField.value = socialMedia.linkedin || "";
      if (instagramField) instagramField.value = socialMedia.instagram || "";
      if (discordField) discordField.value = socialMedia.discord || "";
    }

    // Load images from database and populate Alpine.js component
    console.log("Branch data loaded:", branchData);
    if (branchData && (branchData.headerImage || branchData.profileImage)) {
      console.log("Images found in database - Header:", branchData.headerImage, "Profile:", branchData.profileImage);
      const imageContainer = document.querySelector('[x-data*="headerPreview"]');
      if (imageContainer) {
        const alpineData = Alpine.$data(imageContainer);
        if (alpineData) {
          if (branchData.headerImage) {
            alpineData.headerPreview = branchData.headerImage;
            console.log("✅ Header image loaded from database:", branchData.headerImage);
          }
          if (branchData.profileImage) {
            alpineData.profilePreview = branchData.profileImage;
            console.log("✅ Profile image loaded from database:", branchData.profileImage);
          }
        } else {
          console.log("❌ Alpine.js data not found");
        }
      } else {
        console.log("❌ Image container not found");
      }
    } else {
      console.log("❌ No images found in database");
    }
  } catch (error) {
    console.error("Error loading branch profile:", error);
  }

  // Form submission handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      // Get form data - mapping original form fields to branches table schema
      const branchData = {
        branchName: getValue("company-name"), // Map company name to branch name
        branchCode: "", // No branch code field in original form
        // branchType is auto-determined based on branch_id == company_id logic
        description: getValue("description"),
        location: getValue("location"),
        email: getValue("email"), // Get email from form field
        phoneNumber: getValue("phone"),
        website: getValue("website"),
        isActive: true, // Default to active
        isOnline: false, // Default to offline
      };

      // Validate data
      const errors = validateBranchData(branchData);
      if (errors.length > 0) {
        return Swal.fire({
          icon: "error",
          title: "Invalid Input",
          html: `<ul class="text-left">${errors
            .map((err) => `<li>• ${err}</li>`)
            .join("")}</ul>`,
        });
      }

      // Show loading
      Swal.fire({
        title: "Saving branch...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // Get company ID for image uploads
      const user = await account.get();
      const companyId = user.$id;

      // Save to Appwrite first to get branchId
      const result = await saveBranchProfileToAppwrite(branchData);
      console.log("✅ Branch saved to Appwrite:", result);
      
      const branchId = result.branchId;

      // Upload images to Appwrite Storage
      const uploadedImages = await uploadImagesToAppwrite(branchId, companyId);
      console.log("Uploaded images:", uploadedImages);
      
      // Update branch with image URLs
      if (uploadedImages.headerImage || uploadedImages.profileImage) {
        const updateData = {
          header_image: uploadedImages.headerImage || "",
          profile_image: uploadedImages.profileImage || ""
        };
        
        console.log("Updating branch with image URLs:", updateData);
        
        // Update the branch document with image URLs
        const branchDoc = await databases.listDocuments(
          DB_ID,
          BRANCHES_COLL,
          [Query.equal("branch_id", branchId)]
        );
        
        if (branchDoc.documents.length > 0) {
          const updateResult = await databases.updateDocument(
            DB_ID,
            BRANCHES_COLL,
            branchDoc.documents[0].$id,
            updateData
          );
          console.log("✅ Branch updated with image URLs:", updateResult);
        } else {
          console.log("❌ Branch document not found for update");
        }
      } else {
        console.log("❌ No images uploaded");
      }

      // Save working days to Appwrite
      const workingDaysData = getWorkingDaysData();
      if (workingDaysData.length > 0) {
        const workingDaysResult = await saveWorkingDaysToAppwrite(workingDaysData, branchId, companyId);
        console.log("✅ Working days saved to Appwrite:", workingDaysResult);
      }

      // Save social media to Appwrite
      const socialMediaData = getSocialMediaData();
      const socialMediaResult = await saveSocialMediaToAppwrite(socialMediaData, branchId, companyId);
      console.log("✅ Social media saved to Appwrite:", socialMediaResult);

      // Data is now stored in Appwrite DB, no need for localStorage
      console.log("✅ All data saved to Appwrite DB successfully");

      Swal.fire({
        icon: "success",
        title: "Profile Saved",
        text: "Your branch information, working days, social media, and images have been saved successfully.",
      });
    } catch (err) {
      console.error("❌ Branch save error:", err);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text:
          err.message ||
          "Something went wrong while saving your branch. Please try again.",
      });
    }
  });
});