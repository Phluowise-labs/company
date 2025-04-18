{
    "companyName": "Phluowise",
    "email": "test@example.com",
    "password": "Test@1234"
}

{
    "company_name": "ACME Corp",
    "email": "test@example.com",
    "password": "Password@123",
    "confirm_password": "Password@123"
}

// end of checkEmailStatus function
.finally(() => {
    if (localStorage.getItem("signupEmail")) {
        setTimeout(checkEmailStatus, 3000);
    }
});