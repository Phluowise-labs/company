const baseUrl = "https://phluowise.azurewebsites.net";

// Function to fetch company profile from API
async function fetchCompanyProfile() {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.warn("No auth token found");
      return null;
    }

    const response = await fetch(`${baseUrl}/company-admin/GetProfile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched company profile:", data);
    return data.data || data;
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");
  if (!form) return;

  // Load company data from API
  const companyData = await fetchCompanyProfile();
  if (companyData) {
    document.getElementById("company-name").value =
      companyData.companyName || "";
    document.getElementById("description").value =
      companyData.description || "";
    document.getElementById("location").value =
      companyData.companyLocation || "";
    document.getElementById("phone").value =
      companyData.CompanyPhoneNumber || "";
    document.getElementById("website").value = companyData.website || "";

    if (companyData.socialHandles) {
      Object.entries(companyData.socialHandles).forEach(
        ([platform, handle]) => {
          const input = document.querySelector(`input[name="${platform}"]`);
          if (input) input.value = handle;
        }
      );
    }

    if (window.Alpine && Array.isArray(companyData.workingDays)) {
      const alpineComponent = document.querySelector('[x-data*="workingDays"]');
      if (
        alpineComponent &&
        alpineComponent._x_dataStack &&
        alpineComponent._x_dataStack[0]
      ) {
        alpineComponent._x_dataStack[0].workingDays = companyData.workingDays;
      }
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const profileImage = await getImagePreview("profile-upload");
    const headerImage = await getImagePreview("header-upload");

    const companyData = {
      companyName: getValue("company-name"),
      description: getValue("description"),
      companyLocation: getValue("location"),
      CompanyPhoneNumber: getValue("phone"),
      website: getValue("website"),
      socialHandles: getSocialHandles(),
      workingDays: getworkingDays(),
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
      Swal.fire({
        title: "Saving profile...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const loggedInCompany = JSON.parse(
        localStorage.getItem("loggedInCompany") || "{}"
      );
      const authToken = localStorage.getItem("authToken");

      if (!loggedInCompany.id || !authToken) {
        throw new Error("You must be logged in to update your profile.");
      }

      const formData = new FormData();
      formData.append("CompanyName", companyData.companyName);
      formData.append("Description", companyData.description);
      formData.append("CompanyLocation", companyData.companyLocation);
      formData.append(
        "CompanyPhoneNumber",
        companyData.CompanyPhoneNumber || ""
      );
      formData.append("Website", companyData.website || "");

      if (Object.keys(companyData.socialHandles).length > 0) {
        formData.append(
          "SocialHandles",
          JSON.stringify(companyData.socialHandles)
        );
      }

      if (
        Array.isArray(companyData.workingDays) &&
        companyData.workingDays.length > 0
      ) {
        const validWorkingDays = companyData.workingDays
          .map((day) => {
            if (typeof day === "string") {
              try {
                day = JSON.parse(day);
              } catch {
                return null;
              }
            }
            if (day && typeof day === "object" && day.day) {
              return {
                Day: String(day.day),
                OpenTime: String(day.open || ""),
                CloseTime: String(day.close || ""),
              };
            }
            return null;
          })
          .filter(Boolean);

        if (validWorkingDays.length > 0) {
          const validatedWorkingDays = validWorkingDays.map((day) => ({
            Day: String(day.Day || day.day || ""),
            OpenTime: String(day.OpenTime || day.open || ""),
            CloseTime: String(day.CloseTime || day.close || ""),
          }));
          formData.append("workingDays", JSON.stringify(validatedWorkingDays));
        }
      }

      if (companyData.profileImage) {
        const profileImageFile = await base64ToFile(
          companyData.profileImage,
          "profile-image.jpg"
        );
        formData.append("ProfileImage", profileImageFile);
      }

      if (companyData.headerImage) {
        const headerImageFile = await base64ToFile(
          companyData.headerImage,
          "header-image.jpg"
        );
        formData.append("HeaderImage", headerImageFile);
      }

      const response = await fetch(`${baseUrl}/company-admin/EditProfile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      let result;
      try {
        result = await response.json();
      } catch {
        const text = await response.text();
        throw new Error(`Server response error: ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(
          result.message || `Status ${response.status}: ${response.statusText}`
        );
      }

      console.log("✅ Profile saved to API:", result);

      const savedProfile = {
        ...companyData,
        ...(result?.data || {}),
        workingDays: companyData.workingDays,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem("companyProfile", JSON.stringify(savedProfile));

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
        text:
          err.message ||
          "Something went wrong while saving your profile. Try again.",
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
        handles[platform.toLowerCase()] = sanitizeInput(input.value.trim());
      }
    });
    return handles;
  }

  function getworkingDays() {
    try {
      const alpineComponent = Alpine.$data(document.querySelector("[x-data]"));
      const workingDays =
        alpineComponent?.workingDays ||
        document.querySelector('[x-data*="workingDays"]')?._x_dataStack?.[0]
          ?.workingDays ||
        [];
      return Array.isArray(workingDays) ? workingDays : [];
    } catch {
      return [];
    }
  }

  // 🔒 Global sanitize function for all inputs
  function sanitizeInput(input) {
    if (!input) return "";
    let sanitized = String(input).replace(/<[^>]*>?/gm, ""); // strip HTML
    const blacklist =
      /(\b(SELECT|UPDATE|DELETE|INSERT|DROP|ALTER|CREATE|TRUNCATE)\b|['";])/gi;
    sanitized = sanitized.replace(blacklist, "");
    return sanitized.trim();
  }

  function validateCompanyData(data) {
    const errors = [];
    const maxLength = 500;
    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    const phonePattern = /^[0-9]{10,15}$/;
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    // Required checks
    if (!data.companyName) errors.push("Company name is required.");
    else if (data.companyName.length > 100)
      errors.push("Company name must be less than 100 characters.");

    if (!data.description) errors.push("Description is required.");
    else if (data.description.length > maxLength)
      errors.push(`Description must be less than ${maxLength} characters.`);

    if (!data.companyLocation) errors.push("Location is required.");
    else if (data.companyLocation.length > 200)
      errors.push("Location must be less than 200 characters.");

    if (
      data.CompanyPhoneNumber &&
      !phonePattern.test(data.CompanyPhoneNumber)
    ) {
      errors.push("Please enter a valid phone number (10-15 digits).");
    }

    if (data.website && data.website.trim() !== "") {
      try {
        new URL(data.website);
        if (!urlPattern.test(data.website))
          errors.push("Please enter a valid website URL.");
      } catch {
        errors.push("Please enter a valid website URL.");
      }
    }

    if (data.workingDays && data.workingDays.length > 0) {
      const daysOfWeek = new Set();
      data.workingDays.forEach((day, index) => {
        const dayName = day.day || day.Day || `Day ${index + 1}`;
        const openTime = day.OpenTime || day.open || "";
        const closeTime = day.CloseTime || day.close || "";

        if (daysOfWeek.has(dayName)) {
          errors.push(`Duplicate entry for ${dayName}.`);
        } else {
          daysOfWeek.add(dayName);
        }

        if (openTime && !timePattern.test(openTime)) {
          errors.push(`Invalid opening time format for ${dayName}. Use HH:MM.`);
        }
        if (closeTime && !timePattern.test(closeTime)) {
          errors.push(`Invalid closing time format for ${dayName}. Use HH:MM.`);
        }

        if (openTime && closeTime) {
          const [oh, om] = openTime.split(":").map(Number);
          const [ch, cm] = closeTime.split(":").map(Number);
          if (oh > ch || (oh === ch && om >= cm)) {
            errors.push(
              `Opening time must be before closing time for ${dayName}.`
            );
          }
        }
      });
    }

    // 🔒 sanitize all inputs
    data.companyName = sanitizeInput(data.companyName);
    data.description = sanitizeInput(data.description);
    data.companyLocation = sanitizeInput(data.companyLocation);
    data.website = sanitizeInput(data.website);

    if (data.socialHandles) {
      Object.keys(data.socialHandles).forEach((key) => {
        data.socialHandles[key] = sanitizeInput(data.socialHandles[key]);
      });
    }

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
});
