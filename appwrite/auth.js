function loginUser() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const loginRequest = {
    Email: email,
    Password: password,
  };

  fetch("http://localhost:5161/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginRequest),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Store the session token in localStorage
        localStorage.setItem("sessionToken", data.token);
        alert("Login Successful");
        // Redirect or show appropriate user details
      } else {
        alert(data.message); // Show error message
      }
    })
    .catch((error) => {
      console.error("Error during login:", error);
    });
}
  function checkSession() {
    const sessionToken = localStorage.getItem("sessionToken");

    if (!sessionToken) {
      alert("You are not logged in.");
      window.location.href = "user-signin.html";
      return;
    }

    fetch("http://localhost:5161/api/auth/check-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionToken),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
            window.location.href = "account.html"; // Redirect to account page
          console.log("Session is valid:", data);
          // You can use data to display user info or role
        } else {
          alert(data.message); // Invalid session, redirect to login
        }
      })
      .catch((error) => {
        console.error("Error checking session:", error);
      });
  }

