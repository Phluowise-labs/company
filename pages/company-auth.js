const baseUrl = "https://phlowise-amggdaagb5ancjfu.eastus-01.azurewebsites.net";

// LocalStorage keys
const STORAGE_KEYS = {
  OTP_TOKEN: "otpToken",
  LOGIN_TOKEN: "loginToken",
  OTP_PURPOSE: "otpPurpose",
  REGISTERED_COMPANY: "registeredCompany",
  LOGGED_IN_COMPANY: "loggedInCompany",
  AUTH_TOKEN: "authToken",
  OTP_EMAIL: "otpEmail",
  RESEND_TIMEOUT: "resendTimeout",
};

// Initialize all event listeners
document.addEventListener("DOMContentLoaded", () => {
  // OTP Page
  if (document.getElementById("otpForm")) {
    setupOtpInputs();
    checkOtpPageAccess();
    setupResendButton();
    document
      .getElementById("otpForm")
      .addEventListener("submit", handleOtpValidation);
  }

  // Registration Page
  if (document.getElementById("registerForm")) {
    document
      .getElementById("registerForm")
      .addEventListener("submit", handleRegister);
  }

  // Login Page
  if (document.getElementById("loginForm")) {
    document
      .getElementById("loginForm")
      .addEventListener("submit", handleLogin);
  }

  // Forgot Password Page
  if (document.getElementById("forgotForm")) {
    document
      .getElementById("forgotForm")
      .addEventListener("submit", handleForgotPassword);
  }

  // Change Password Page
  if (document.getElementById("changeForm")) {
    checkAuthAccess();
    document
      .getElementById("changeForm")
      .addEventListener("submit", handleChangePassword);
  }

  // Reset Password Page
  if (document.getElementById("resetForm")) {
    checkResetPasswordAccess();
    document
      .getElementById("resetForm")
      .addEventListener("submit", handleResetPassword);
  }
});

// ========================
// 1. REGISTER COMPANY
// ========================

async function handleRegister(e) {
  e.preventDefault();
  const form = document.getElementById("registerForm");

  // Field values
  const companyName = document.getElementById("companyName").value.trim();
  const companyEmail = document.getElementById("companyEmail").value.trim();
  const companyPhoneNumber = document.getElementById("companyPhoneNumber").value.trim();
  const password = document.getElementById("password").value;

  // Error elements
  const companyError = document.getElementById("companyError");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");

  // Hide all errors first
  companyError.classList.add("hidden");
  emailError.classList.add("hidden");
  passwordError.classList.add("hidden");

  let hasError = false;

  if (!companyName) {
    companyError.textContent = "Company name is required.";
    companyError.classList.remove("hidden");
    hasError = true;
  }

  if (!companyEmail || !isValidEmail(companyEmail)) {
    emailError.textContent = "Invalid email format.";
    emailError.classList.remove("hidden");
    hasError = true;
  }

  if (!password || !isValidPassword(password)) {
    passwordError.textContent = "Password must be at least 8 characters, contain uppercase, lowercase, number, and special character.";
    passwordError.classList.remove("hidden");
    hasError = true;
  }

  if (hasError) return;

  const companyData = {
    companyName,
    companyEmail,
    companyPhoneNumber,
    companyRegistered: true,
    password,
  };

  try {
    showLoading(form); // Show loading indicator

    const response = await fetch(`${baseUrl}/company/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(companyData),
    });

    const result = await response.json();
    console.log("Register Response:", result);

    if (response.ok) {
      Swal.fire("Success", result.message || "Registration successful!", "success");
      localStorage.setItem(STORAGE_KEYS.OTP_TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.OTP_EMAIL, companyEmail);
      setTimeout(() => (window.location.href = "otp-verification.html"), 1500);
    } else {
      const errorTitle = result.title || "Registration Failed";
      const errorDetail = result.detail || result.message || "An unexpected error occurred.";
      const errorType = result.type || "UnknownError";

      Swal.fire({
        icon: "error",
        title: errorTitle,
        html: `
          <strong>Type:</strong> ${errorType}<br>
          <strong>Detail:</strong> ${errorDetail}
        `,
      });
    }
  } catch (error) {
    Swal.fire("Error", `Something went wrong: ${error.message}`, "error");
  } finally {
    hideLoading(form); // Hide loading indicator
  }
}

// Password validation
function isValidPassword(password) {
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordPattern.test(password);
}

// Email validation
function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}


// ========================
// LOGIN - Send OTP
// ========================
async function handleLogin(e) {
  e.preventDefault();
  const form = document.getElementById("loginForm");
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  // Validate inputs
  if (!email || !isValidEmail(email)) {
    await Swal.fire({
      icon: 'error',
      title: 'Invalid Email',
      text: 'Please enter a valid email address',
      confirmButtonColor: '#4f46e5'
    });
    return;
  }

  if (!password || !isValidPassword(password)) {
    await Swal.fire({
      icon: 'error',
      title: 'Invalid Password',
      text: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      confirmButtonColor: '#4f46e5'
    });
    return;
  }

  const loginData = {
    email: email,
    password: password
  };

  try {
    // Show loading state
    Swal.fire({
      title: 'Processing',
      html: 'Please wait...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)'
    });

    const response = await fetch(`${baseUrl}/company/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    const result = await response.json();
    console.log("Login Response:", result);

    // Close loading dialog first
    Swal.close();

    if (response.ok) {
      await Swal.fire({
        icon: 'success',
        title: 'OTP Sent',
        text: result.message || 'Verification code sent to your email',
        confirmButtonColor: '#4f46e5',
        background: '#ffffff'
      });
      
      // Store tokens for OTP verification
      localStorage.setItem(STORAGE_KEYS.OTP_PURPOSE, "login");
      localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.OTP_EMAIL, email);
      
      // Redirect to OTP page after success
      window.location.href = "otp-verification.html";
    } else {
      // Handle specific error cases
      let errorMessage = result.detail || result.message || 'Login failed. Please try again.';
      
      if (response.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      }

      await Swal.fire({
        icon: 'error',
        title: result.title || 'Login Failed',
        text: errorMessage,
        confirmButtonColor: '#4f46e5',
        background: '#ffffff'
      });
    }
  } catch (error) {
    Swal.close();
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `Something went wrong: ${error.message}`,
      confirmButtonColor: '#4f46e5',
      background: '#ffffff'
    });
  }
}


// Rest of your existing helper functions (isValidEmail, isValidPassword, etc.)

// ========================
// 3. FORGOT PASSWORD - Send OTP
// ========================
async function handleForgotPassword(e) {
  e.preventDefault();
  const form = document.getElementById("forgotForm");
  const messageElement = document.getElementById("forgotMessage");

  const email = document.getElementById("forgotEmail").value;

  try {
    showLoading(form);
    const response = await fetch(`${baseUrl}/company/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    console.log("Forgot Password Response:", result);

    if (response.ok) {
      showMessage(messageElement, result.message, "success");
      
      // Store all necessary tokens for the reset flow
      localStorage.setItem(STORAGE_KEYS.OTP_PURPOSE, "forgot");
      localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.OTP_EMAIL, email);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token);
      
      setTimeout(() => (window.location.href = "otp-verification.html"), 1500);
    } else {
      showMessage(
        messageElement,
        result.message || "Failed to send OTP.",
        "error"
      );
    }
  } catch (error) {
    showMessage(messageElement, `Error: ${error.message}`, "error");
  } finally {
    hideLoading(form);
  }
}

// ========================
// OTP VALIDATION
// ========================
async function handleOtpValidation(e) {
  e.preventDefault();
  const form = document.getElementById("otpForm");
  const errorElement = document.getElementById("errorMessage");
  const verifyButton = document.getElementById("verifyButton");

  // Combine all OTP digits
  const otp = Array.from({ length: 6 }, (_, i) =>
    document.getElementById(`otp${i + 1}`).value.trim()
  ).join("");

  // Validate OTP length
  if (otp.length !== 6) {
    errorElement.textContent = "Please enter a complete 6-digit code";
    errorElement.classList.remove("hidden");
    return;
  }

  // Show loading state
  verifyButton.disabled = true;
  verifyButton.classList.add("btn-loading");
  verifyButton.innerHTML = "Verifying...";

  const registerToken = localStorage.getItem(STORAGE_KEYS.OTP_TOKEN);
  const loginToken = localStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN);
  const purpose = localStorage.getItem(STORAGE_KEYS.OTP_PURPOSE);

  try {
    let response, result;

    if (registerToken) {
      response = await fetch(`${baseUrl}/company/register-validate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: registerToken,
          otp: otp,
        }),
      });
    } else if (loginToken) {
      response = await fetch(`${baseUrl}/company/validate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: loginToken,
          otp: otp,
        }),
      });
    } else {
      throw new Error("No OTP session found. Please start the process again.");
    }

    result = await response.json();
    console.log("OTP Validation Response:", result);

    if (!response.ok) {
      throw new Error(
        result.message || "OTP validation failed. Please try again."
      );
    }

    // Success handling
    errorElement.classList.add("hidden");

    if (registerToken) {
      // Registration success
      localStorage.setItem(
        STORAGE_KEYS.REGISTERED_COMPANY,
        JSON.stringify(result)
      );
      localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
      showSuccessToast("Registration successful! Redirecting to login...");
      setTimeout(() => (window.location.href = "user-signin.html"), 2000);
    } else {
      // Login/Forgot password success
      localStorage.setItem(
        STORAGE_KEYS.LOGGED_IN_COMPANY,
        JSON.stringify(result)
      );
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token);
      
      // Only remove these if we're not in forgot password flow
      if (purpose !== "forgot") {
        localStorage.removeItem(STORAGE_KEYS.LOGIN_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.OTP_PURPOSE);
      }

      const redirectUrl = purpose === "forgot" 
        ? "setnew_password.html" 
        : "account.html";
      showSuccessToast(
        purpose === "forgot"
          ? "OTP verified! You can now set your new password."
          : "Login successful!"
      );
      setTimeout(() => (window.location.href = redirectUrl), 1500);
    }
  } catch (error) {
    console.error("OTP Validation Error:", error);
    errorElement.textContent = error.message;
    errorElement.classList.remove("hidden");

    // If the error suggests an expired/invalid token, clear it
    if (error.message.includes("expired") || error.message.includes("invalid")) {
      localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.LOGIN_TOKEN);
    }
  } finally {
    verifyButton.disabled = false;
    verifyButton.classList.remove("btn-loading");
    verifyButton.textContent = "Verify Code";
  }
}

// ========================
// 5. CHANGE PASSWORD
// ========================
async function handleChangePassword(e) {
  e.preventDefault();
  const form = document.getElementById("changeForm");
  const messageElement = document.getElementById("changeMessage");

  // Get the form field values
  const changeEmail = document.getElementById("changeEmail").value;
  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  // Clear previous messages
  clearMessage(messageElement);

  // Email validation
  if (!changeEmail || !isValidEmail(changeEmail)) {
    showMessage(messageElement, "Please enter a valid email address.", "error");
    return;
  }

  // Old Password validation
  if (!oldPassword) {
    showMessage(messageElement, "Old password is required.", "error");
    return;
  }

  // New Password validation
  if (!newPassword || !isValidPassword(newPassword)) {
    showMessage(
      messageElement,
      "New password must be at least 8 characters long, contain uppercase, lowercase, number, and special character.",
      "error"
    );
    return;
  }

  const changeData = {
    email: changeEmail,
    oldPassword: oldPassword,
    newPassword: newPassword,
  };

  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    showMessage(messageElement, "Unauthorized. Please log in first.", "error");
    return;
  }

  try {
    showLoading(form); // Show loading indicator
    const response = await fetch(`${baseUrl}/company/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(changeData),
    });

    const result = await response.json();
    console.log("Change Password Response:", result);

    if (response.ok) {
      showMessage(messageElement, result.message, "success");
      form.reset(); // Clear form fields
    } else {
      showMessage(
        messageElement,
        result.message || "Change password failed.",
        "error"
      );
    }
  } catch (error) {
    showMessage(messageElement, `Error: ${error.message}`, "error");
  } finally {
    hideLoading(form); // Hide loading indicator
  }
}

// ========================
//6 . RESET PASSWORD
// ========================
async function handleResetPassword(e) {
  e.preventDefault();
  const form = document.getElementById("resetForm");
  const messageElement = document.getElementById("resetMessage");

  const newPassword = document.getElementById("resetPassword").value;
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  // Clear previous messages
  clearMessage(messageElement);

  // New Password validation
  if (!newPassword || !isValidPassword(newPassword)) {
    showMessage(
      messageElement,
      "Password must be at least 8 characters, contain uppercase, lowercase, number, and special character.",
      "error"
    );
    return;
  }

  if (!token) {
    showMessage(messageElement, "Session expired. Please request password reset again.", "error");
    return;
  }

  try {
    showLoading(form);
    const response = await fetch(`${baseUrl}/company/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    const result = await response.json();
    console.log("Reset Password Response:", result);

    if (response.ok) {
      showMessage(messageElement, result.message, "success");
      // Clear all auth-related storage
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.OTP_PURPOSE);
      localStorage.removeItem(STORAGE_KEYS.LOGIN_TOKEN);
      
      setTimeout(() => {
        window.location.href = "user-signin.html";
      }, 1500);
    } else {
      showMessage(
        messageElement,
        result.message || "Reset password failed.",
        "error"
      );
    }
  } catch (error) {
    showMessage(messageElement, `Error: ${error.message}`, "error");
  } finally {
    hideLoading(form);
  }
}


// ========================
// HELPER FUNCTIONS
// ========================
function setupOtpInputs() {
  const otpInputs = document.querySelectorAll(".otp-field");

  otpInputs.forEach((input, index) => {
    // Allow only numeric input
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    // Handle backspace
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && e.target.value === "" && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });
}

function setupResendButton() {
  const resendBtn = document.getElementById("resendCode");
  const resendMsg = document.getElementById("resendMessage");

  if (!resendBtn) return;

  // Check if cooldown is active
  const cooldownEnd = localStorage.getItem(STORAGE_KEYS.RESEND_TIMEOUT);
  if (cooldownEnd && Date.now() < cooldownEnd) {
    startResendCooldown(Math.ceil((cooldownEnd - Date.now()) / 1000));
    return;
  }

  resendBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const registerToken = localStorage.getItem(STORAGE_KEYS.OTP_TOKEN);
    const loginToken = localStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN);
    const purpose = localStorage.getItem(STORAGE_KEYS.OTP_PURPOSE);
    const email = localStorage.getItem(STORAGE_KEYS.OTP_EMAIL);

    if (!email) {
      resendMsg.textContent = "No email found. Please start the process again.";
      resendMsg.classList.remove("hidden");
      return;
    }

    try {
      resendBtn.disabled = true;
      resendMsg.textContent = "Sending new code...";
      resendMsg.classList.remove("hidden");

      let response;
      if (registerToken) {
        response = await fetch(`${baseUrl}/company/register-resend-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: registerToken }),
        });
      } else if (loginToken) {
        const endpoint =
          purpose === "forgot" ? "/company/forgot-password" : "/company/login";
        response = await fetch(`${baseUrl}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } else {
        throw new Error("No active OTP session found");
      }

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to resend OTP");

      resendMsg.textContent = "New verification code sent!";
      localStorage.setItem(STORAGE_KEYS.RESEND_TIMEOUT, Date.now() + 60000); // 1 minute cooldown
      startResendCooldown(60);
    } catch (error) {
      resendMsg.textContent = error.message;
      resendBtn.disabled = false;
    }
  });
}


function startResendCooldown(seconds) {
  const resendBtn = document.getElementById("resendCode");
  if (!resendBtn) return;

  resendBtn.disabled = true;
  let cooldown = seconds;

  const timer = setInterval(() => {
    resendBtn.textContent = `Resend Code (${cooldown}s)`;
    cooldown--;

    if (cooldown < 0) {
      clearInterval(timer);
      resendBtn.textContent = "Resend Code";
      resendBtn.disabled = false;
      localStorage.removeItem(STORAGE_KEYS.RESEND_TIMEOUT);
    }
  }, 1000);
}



function checkOtpPageAccess() {
  const registerToken = localStorage.getItem(STORAGE_KEYS.OTP_TOKEN);
  const loginToken = localStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN);
  const errorElement = document.getElementById("errorMessage");

  if (!registerToken && !loginToken) {
    errorElement.textContent =
      "No OTP requested. Please start from registration or login.";
    errorElement.classList.remove("hidden");
    setTimeout(() => (window.location.href = "user-signup.html"), 3000);
  }
}

function checkAuthAccess() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const messageElement =
    document.getElementById("changeMessage") ||
    document.getElementById("resetMessage");

  if (!token && messageElement) {
    showMessage(messageElement, "Please login first.", "error");
    setTimeout(() => (window.location.href = "user-signin.html"), 1500);
  }
}

function checkResetPasswordAccess() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const purpose = localStorage.getItem(STORAGE_KEYS.OTP_PURPOSE);
  const messageElement = document.getElementById("resetMessage");

  if (!token) {
    showMessage(
      messageElement,
      "Session expired. Please request password reset again.",
      "error"
    );
    setTimeout(() => (window.location.href = "forgot_password.html"), 1500);
    return;
  }

  if (purpose !== "forgot") {
    showMessage(
      messageElement,
      "Invalid password reset request. Please start the process again.",
      "error"
    );
    setTimeout(() => (window.location.href = "forgot_password.html"), 1500);
  }
}


function showMessage(element, message, type) {
  if (!element) return;
  element.innerHTML = `<p class="${type}">${message}</p>`;
  element.classList.remove("hidden");
}

function clearMessage(element) {
  if (!element) return;
  element.innerHTML = "";
  element.classList.add("hidden");
}

function showLoading(form) {
  if (!form) return;
  const button = form.querySelector("button[type='submit']");
  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Processing...';
  }
}

function hideLoading(form) {
  if (!form) return;
  const button = form.querySelector("button[type='submit']");
  if (button) {
    button.disabled = false;
    button.textContent = button.textContent
      .replace('<span class="spinner"></span> Processing...', "Submit")
      .replace("Processing...", "Submit");
  }
}

function showSuccessToast(message) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: "success",
    title: message,
  });
}

function isValidPassword(password) {
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordPattern.test(password);
}

function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}