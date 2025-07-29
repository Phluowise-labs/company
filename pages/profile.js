const baseUrl = "https://phluowise.azurewebsites.net";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const profileImage = await getImagePreview("profile-upload");
    const headerImage = await getImagePreview("header-upload");

    const companyData = {
      companyName: getValue("company-name"),
      description: getValue("description"),
      location: getValue("location"),
      website: getValue("website"),
      socialHandles: getSocialHandles(),
      workingDays: getWorkingDays(),
      profileImage,
      headerImage,
    };

    const errors = validateCompanyData(companyData);
    if (errors.length > 0) {
      return Swal.fire({
        icon: "error",
        title: "Invalid Input",
        html: `<ul class="text-left">${errors
          .map((err) => `<li>• ${err}</li>`)
          .join("")}</ul>`,
      });
    }

    try {
      // Show loading state
      Swal.fire({
        title: 'Saving profile...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Get company ID from localStorage
      const loggedInCompany = JSON.parse(localStorage.getItem("loggedInCompany") || "{}");
      const authToken = localStorage.getItem("authToken");
      
      if (!loggedInCompany.id || !authToken) {
        throw new Error("You must be logged in to update your profile.");
      }

      // Prepare form data for API
      const formData = new FormData();
      formData.append("CompanyId", loggedInCompany.id);
      formData.append("CompanyName", companyData.companyName);
      formData.append("Description", companyData.description);
      formData.append("Location", companyData.location);
      formData.append("Website", companyData.website || "");
      
      // Add social handles
      if (Object.keys(companyData.socialHandles).length > 0) {
        formData.append("SocialHandles", JSON.stringify(companyData.socialHandles));
      }
      
      // Add working days
      if (companyData.workingDays.length > 0) {
        formData.append("WorkingDays", JSON.stringify(companyData.workingDays));
      }
      
      // Convert base64 images to files if available
      if (companyData.profileImage) {
        const profileImageFile = await base64ToFile(companyData.profileImage, "profile-image.jpg");
        formData.append("ProfileImage", profileImageFile);
      }
      
      if (companyData.headerImage) {
        const headerImageFile = await base64ToFile(companyData.headerImage, "header-image.jpg");
        formData.append("HeaderImage", headerImageFile);
      }

      // Send to API
      const response = await fetch(`${baseUrl}/company/update-profile`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Status ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Profile saved to API:", result);

      // Also save to localStorage for local access
      localStorage.setItem("companyProfile", JSON.stringify(companyData));
      
      Swal.fire({
        icon: "success",
        title: "Profile Saved",
        text: "Your profile information has been saved successfully.",
      });
    } catch (err) {
      console.error("❌ Profile save error:", err);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err.message || "Something went wrong while saving your profile. Try again.",
      });
    }
  });

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function getImagePreview(inputId) {
    return new Promise((resolve) => {
      const input = document.getElementById(inputId);
      const file = input?.files?.[0];
      if (!file) return resolve(null);

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  function getSocialHandles() {
    const platforms = [
      "Whatsapp",
      "Twitter",
      "Facebook",
      "LinkedIn",
      "Instagram",
      "Discord",
    ];
    const handles = {};

    platforms.forEach((platform) => {
      const input = document.querySelector(`input[name="${platform}"]`);
      if (input && input.value.trim()) {
        handles[platform.toLowerCase()] = input.value.trim();
      }
    });

    return handles;
  }

  function getWorkingDays() {
    try {
      const alpineComponent = document.querySelector('[x-data*="workingDays"]')
        ?._x_dataStack?.[0];
      return alpineComponent?.workingDays || [];
    } catch {
      return [];
    }
  }

  function validateCompanyData(data) {
    const errors = [];

    if (!data.companyName) errors.push("Company name is required.");
    if (!data.description) errors.push("Description is required.");
    if (!data.location) errors.push("Location is required.");

    // Validate website if entered
    if (data.website && !isValidURL(data.website)) {
      errors.push(
        "Website must be a valid URL (start with http:// or https://)."
      );
    }

    // Social handles – no validation needed for usernames (just strip full URLs if needed)
    // WhatsApp format could be checked for number format if required (optional)

    data.workingDays.forEach((day) => {
      if (!day.open || !day.close) {
        errors.push(`Set both opening and closing times for ${day.day}.`);
      }
    });

    return errors;
  }

  function isValidURL(url) {
    return /^(https?:\/\/)/i.test(url);
  }
  
  // Helper function to convert base64 to File object
  async function base64ToFile(base64String, filename) {
    // Extract the MIME type and base64 data
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string format');
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
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type });
    return new File([blob], filename, { type });
  }
});
