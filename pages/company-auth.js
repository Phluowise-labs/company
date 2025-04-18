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
  RESEND_TIMEOUT: "resendTimeout"
};

// Initialize all event listeners
document.addEventListener('DOMContentLoaded', () => {
  // OTP Page
  if (document.getElementById("otpForm")) {
    setupOtpInputs();
    checkOtpPageAccess();
    setupResendButton();
    document.getElementById("otpForm").addEventListener("submit", handleOtpValidation);
  }

  // Registration Page
  if (document.getElementById("registerForm")) {
    document.getElementById("registerForm").addEventListener("submit", handleRegister);
  }

  // Login Page
  if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", handleLogin);
  }

  // Forgot Password Page
  if (document.getElementById("forgotForm")) {
    document.getElementById("forgotForm").addEventListener("submit", handleForgotPassword);
  }

  // Change Password Page
  if (document.getElementById("changeForm")) {
    checkAuthAccess();
    document.getElementById("changeForm").addEventListener("submit", handleChangePassword);
  }

  // Reset Password Page
  if (document.getElementById("resetForm")) {
    checkResetPasswordAccess();
    document.getElementById("resetForm").addEventListener("submit", handleResetPassword);
  }
});

// ========================
// 1. REGISTER COMPANY
// ========================
async function handleRegister(e) {
  e.preventDefault();
  const form = document.getElementById("registerForm");
  const messageElement = document.getElementById("registerMessage");
  
  const companyData = {
    companyName: document.getElementById("companyName").value,
    companyEmail: document.getElementById("companyEmail").value,
    companyPhoneNumber: document.getElementById("companyPhoneNumber").value,
    companyRegistered: true,
    password: document.getElementById("password").value,
  };

  try {
    showLoading(form);
    const response = await fetch(`${baseUrl}/company/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(companyData)
    });

    const result = await response.json();
    console.log("Register Response:", result);

    if (response.ok) {
      showMessage(messageElement, result.message, "success");
      localStorage.setItem(STORAGE_KEYS.OTP_TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.OTP_EMAIL, companyData.companyEmail);
      setTimeout(() => window.location.href = "otp-verification.html", 1500);
    } else {
      showMessage(messageElement, result.message || "Registration failed.", "error");
    }
  } catch (error) {
    showMessage(messageElement, `Error: ${error.message}`, "error");
  } finally {
    hideLoading(form);
  }
}

// ========================
// 2. LOGIN - Send OTP
// ========================
async function handleLogin(e) {
  e.preventDefault();
  const form = document.getElementById("loginForm");
  const messageElement = document.getElementById("loginMessage");
  
  const loginData = {
    email: document.getElementById("loginEmail").value,
    password: document.getElementById("loginPassword").value,
  };

  try {
    showLoading(form);
    const response = await fetch(`${baseUrl}/company/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    const result = await response.json();
    console.log("Login Response:", result);

    if (response.ok) {
      showMessage(messageElement, result.message, "success");
      localStorage.setItem(STORAGE_KEYS.OTP_PURPOSE, "login");
      localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.OTP_EMAIL, loginData.email);
      setTimeout(() => window.location.href = "otp-verification.html", 1500);
    } else {
      showMessage(messageElement, result.message || "Login failed.", "error");
    }
  } catch (error) {
    showMessage(messageElement, `Error: ${error.message}`, "error");
  } finally {
    hideLoading(form);
  }
}

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
      localStorage.setItem(STORAGE_KEYS.OTP_PURPOSE, "forgot");
      localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.OTP_EMAIL, email);
      setTimeout(() => window.location.href = "otp-verification.html", 1500);
    } else {
      showMessage(messageElement, result.message || "Failed to send OTP.", "error");
    }
  } catch (error) {
    showMessage(messageElement, `Error: ${error.message}`, "error");
  } finally {
    hideLoading(form);
  }
}

// ========================
// 4. OTP VALIDATION
// ========================
async function handleOtpValidation(e) {
  e.preventDefault();
  const form = document.getElementById("otpForm");
  const errorElement = document.getElementById("errorMessage");
  const verifyButton = document.getElementById("verifyButton");
  
  // Combine all OTP digits
  const otp = Array.from({length: 6}, (_, i) => 
    document.getElementById(`otp${i+1}`).value.trim()
  ).join('');

  // Validate OTP length
  if (otp.length !== 6) {
    errorElement.textContent = "Please enter a complete 6-digit code";
    errorElement.classList.remove("hidden");
    return;
  }

  // Show loading state
  verifyButton.disabled = true;
  verifyButton.classList.add("btn-loading");
  verifyButton.innerHTML = 'Verifying...';

  const registerToken = localStorage.getItem(STORAGE_KEYS.OTP_TOKEN);
  const loginToken = localStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN);
  const purpose = localStorage.getItem(STORAGE_KEYS.OTP_PURPOSE);

  try {
    let response, result;
    
    // Determine which validation endpoint to use
    if (registerToken) {
      response = await fetch(`${baseUrl}/company/register-validate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: registerToken,
          otp: otp
        })
      });
    } else if (loginToken) {
      response = await fetch(`${baseUrl}/company/validate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: loginToken,
          otp: otp
        })
      });
    } else {
      throw new Error("No OTP session found. Please start the process again.");
    }

    result = await response.json();
    console.log("OTP Validation Response:", result);

    if (!response.ok) {
      throw new Error(result.message || "OTP validation failed. Please try again.");
    }

    // Success handling
    errorElement.classList.add("hidden");
    
    if (registerToken) {
      // Registration success
      localStorage.setItem(STORAGE_KEYS.REGISTERED_COMPANY, JSON.stringify(result));
      localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
      showSuccessToast("Registration successful! Redirecting to login...");
      setTimeout(() => window.location.href = "user-signin.html", 2000);
    } else {
      // Login/Forgot password success
      localStorage.setItem(STORAGE_KEYS.LOGGED_IN_COMPANY, JSON.stringify(result));
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token);
      localStorage.removeItem(STORAGE_KEYS.LOGIN_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.OTP_PURPOSE);

      const redirectUrl = purpose === "forgot" 
        ? "reset-password.html" 
        : "account.html"; // Change to your dashboard page
      showSuccessToast(purpose === "forgot" 
        ? "OTP verified! Redirecting to password reset..." 
        : "Login successful!");
      setTimeout(() => window.location.href = redirectUrl, 1500);
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
  
  const changeData = {
    email: document.getElementById("changeEmail").value,
    oldPassword: document.getElementById("oldPassword").value,
    newPassword: document.getElementById("newPassword").value,
  };

  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    showMessage(messageElement, "Unauthorized. Please log in first.", "error");
    return;
  }

  try {
    showLoading(form);
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
      form.reset();
    } else {
      showMessage(messageElement, result.message || "Change password failed.", "error");
    }
  } catch (error) {
    showMessage(messageElement, `Error: ${error.message}`, "error");
  } finally {
    hideLoading(form);
  }
}

// ========================
// 6. RESET PASSWORD
// ========================
async function handleResetPassword(e) {
  e.preventDefault();
  const form = document.getElementById("resetForm");
  const messageElement = document.getElementById("resetMessage");
  
  const newPassword = document.getElementById("resetPassword").value;
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    showMessage(messageElement, "Unauthorized. Please log in first.", "error");
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
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        window.location.href = "user-signin.html";
      }, 1500);
    } else {
      showMessage(messageElement, result.message || "Reset password failed.", "error");
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
  const otpInputs = document.querySelectorAll('.otp-field');
  
  otpInputs.forEach((input, index) => {
    // Allow only numeric input
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
    
    // Handle backspace
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
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
          body: JSON.stringify({ token: registerToken })
        });
      } else if (loginToken) {
        const endpoint = purpose === "forgot" 
          ? "/company/forgot-password" 
          : "/company/login";
        response = await fetch(`${baseUrl}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
      } else {
        throw new Error("No active OTP session found");
      }

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to resend OTP");

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
    errorElement.textContent = "No OTP requested. Please start from registration or login.";
    errorElement.classList.remove("hidden");
    setTimeout(() => window.location.href = "user-signup.html", 3000);
  }
}

function checkAuthAccess() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const messageElement = document.getElementById("changeMessage") || 
                        document.getElementById("resetMessage");
  
  if (!token && messageElement) {
    showMessage(messageElement, "Please login first.", "error");
    setTimeout(() => window.location.href = "user-signin.html", 1500);
  }
}

function checkResetPasswordAccess() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const purpose = localStorage.getItem(STORAGE_KEYS.OTP_PURPOSE);
  const messageElement = document.getElementById("resetMessage");
  
  if ((!token || purpose !== "forgot") && messageElement) {
    showMessage(messageElement, "Please request password reset first.", "error");
    setTimeout(() => window.location.href = "forgot.html", 1500);
  }
}

function showMessage(element, message, type) {
  if (!element) return;
  element.innerHTML = `<p class="${type}">${message}</p>`;
  element.classList.remove("hidden");
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
      .replace('<span class="spinner"></span> Processing...', 'Submit')
      .replace('Processing...', 'Submit');
  }
}

function showSuccessToast(message) {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });
  
  Toast.fire({
    icon: 'success',
    title: message
  });
}