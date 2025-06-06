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
      localStorage.setItem("companyProfile", JSON.stringify(companyData));
      Swal.fire({
        icon: "success",
        title: "Profile Saved",
        text: "Your profile information has been saved locally.",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: "Something went wrong while saving your profile. Try again.",
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
});
