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
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched company profile:", data);
    return data.data || data; // Handle both {data: {...}} and direct object responses
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
    // Populate form fields
    document.getElementById("company-name").value = companyData.companyName || "";
    document.getElementById("description").value = companyData.description || "";
    document.getElementById("location").value = companyData.companyLocation || "";
    document.getElementById("phone").value = companyData.CompanyPhoneNumber || "";
    document.getElementById("website").value = companyData.website || "";

    // Populate social handles if they exist
    if (companyData.socialHandles) {
      Object.entries(companyData.socialHandles).forEach(([platform, handle]) => {
        const input = document.querySelector(`input[name="${platform}"]`);
        if (input) input.value = handle;
      });
    }

    // Initialize working days in Alpine component
    if (window.Alpine && Array.isArray(companyData.workingDays)) {
      const alpineComponent = document.querySelector('[x-data*="workingDays"]');
      if (alpineComponent && alpineComponent._x_dataStack && alpineComponent._x_dataStack[0]) {
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
      formData.append("CompanyName", companyData.companyName);
      formData.append("Description", companyData.description);
      formData.append("CompanyLocation", companyData.companyLocation);
      formData.append("CompanyPhoneNumber", companyData.CompanyPhoneNumber || "");
      formData.append("Website", companyData.website || "");
      
      // Add social handles
      if (Object.keys(companyData.socialHandles).length > 0) {
        formData.append("SocialHandles", JSON.stringify(companyData.socialHandles));
      }
      
      // Add working days - ensure it's a proper array and filter out invalid entries
      console.log('Original workingDays:', companyData.workingDays);
      
      if (companyData.workingDays && !Array.isArray(companyData.workingDays)) {
        console.warn('workingDays is not an array:', companyData.workingDays);
        // Try to parse if it's a string
        try {
          if (typeof companyData.workingDays === 'string') {
            companyData.workingDays = JSON.parse(companyData.workingDays);
            console.log('Parsed workingDays:', companyData.workingDays);
          }
        } catch (e) {
          console.error('Error parsing workingDays:', e);
          companyData.workingDays = [];
        }
      }
      
      if (Array.isArray(companyData.workingDays) && companyData.workingDays.length > 0) {
        // Filter out any invalid entries and ensure proper formatting
        const validWorkingDays = companyData.workingDays
          .map(day => {
            // Ensure day is an object
            if (typeof day === 'string') {
              try {
                day = JSON.parse(day);
              } catch (e) {
                console.warn('Invalid day format:', day);
                return null;
              }
            }
            
            // Validate day object and format for API
            if (day && typeof day === 'object' && day.day) {
              // Convert to API-expected format with capitalized property names
              // Using lowercase properties that match the form data structure
              return {
                Day: String(day.day),
                OpenTime: String(day.open || ''),  // Changed from openTime to open
                CloseTime: String(day.close || '') // Changed from closeTime to close
              };
            }
            return null;
          })
          .filter(Boolean); // Remove null entries
        
        console.log('Valid working days to send:', validWorkingDays);
        
        if (validWorkingDays.length > 0) {
          // Log the exact data structure before stringifying
          console.log('Working days data before stringify:', JSON.parse(JSON.stringify(validWorkingDays)));
          
          // Ensure all required fields are present and properly cased
          const validatedWorkingDays = validWorkingDays.map(day => ({
            Day: String(day.Day || day.day || ''),
            OpenTime: String(day.OpenTime || day.open || ''),
            CloseTime: String(day.CloseTime || day.close || '')
          }));
          
          console.log('Validated working days:', validatedWorkingDays);
          
          const workingDaysJson = JSON.stringify(validatedWorkingDays);
          console.log('JSON string to send:', workingDaysJson);
          
          // Also log the raw form data for debugging
          for (let pair of formData.entries()) {
            console.log('FormData:', pair[0], '=', pair[1]);
          }
          
          formData.append("workingDays", workingDaysJson);
        } else {
          console.warn('No valid working days to send to API');
        }
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

      // Log all data being sent to API
      console.log('API Request Data:', {
        url: `${baseUrl}/company-admin/EditProfile`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data' // Note: The browser will set this automatically with the correct boundary
        },
        body: Object.fromEntries(formData.entries())
      });

      // Send to API
      const response = await fetch(`${baseUrl}/company-admin/EditProfile`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`
        },
        body: formData
      });

      // Clone the response so we can read it twice if needed
      const responseClone = response.clone();
      let result;
      
      try {
        // First try to parse as JSON
        result = await response.json();
      } catch (e) {
        // If JSON parsing fails, try to get the response as text
        const responseText = await responseClone.text();
        console.error('Error parsing response as JSON:', e);
        
        if (!response.ok) {
          console.error('API Error Response (raw text):', responseText);
          throw new Error(`Status ${response.status}: ${response.statusText}\n${responseText.substring(0, 200)}`);
        }
        
        throw new Error('Invalid JSON response from server');
      }
      
      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: result
        });
        throw new Error(result.message || `Status ${response.status}: ${response.statusText}`);
      }
      console.log("✅ Profile saved to API:", result);

      // Save complete form data to localStorage including API response
      const savedProfile = {
        ...companyData,
        // Include any additional data from the API response if needed
        ...(result?.data || {}),
        // Ensure working days are properly included
        workingDays: companyData.workingDays,
        // Add timestamp
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem("companyProfile", JSON.stringify(savedProfile));
      console.log('✅ Profile saved to localStorage:', savedProfile);
      
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

  function getworkingDays() {
    try {
      // Try to get the Alpine component using the proper way
      const alpineComponent = Alpine.$data(document.querySelector('[x-data]'));
      
      // Fallback to the internal _x_dataStack if the proper way fails
      const workingDays = alpineComponent?.workingDays || 
                         document.querySelector('[x-data*="workingDays"]')?._x_dataStack?.[0]?.workingDays || [];
      
      console.log('Collected working days:', workingDays);
      return Array.isArray(workingDays) ? workingDays : [];
    } catch (error) {
      console.error('Error getting working days:', error);
      return [];
    }
  }

  function validateCompanyData(data) {
    const errors = [];

    // if (!data.companyName) errors.push("Company name is required.");
    // if (!data.description) errors.push("Description is required.");
    // if (!data.companyLocation) errors.push("Location is required.");
    if (data.CompanyPhoneNumber && !/^[0-9]{10,15}$/.test(data.CompanyPhoneNumber)) {
      errors.push("Please enter a valid phone number (10-15 digits)");
    }

    // Social handles – no validation needed for usernames (just strip full URLs if needed)
    // WhatsApp format could be checked for number format if required (optional)

    data.workingDays.forEach((day) => {
      // Check both possible property name formats for backward compatibility
      const openTime = day.OpenTime || day.open;
      const closeTime = day.CloseTime || day.close;
      
      if (!openTime || !closeTime) {
        errors.push(`Set both opening and closing times for ${day.day || 'selected day'}.`);
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
