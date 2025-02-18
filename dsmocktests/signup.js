// ✅ Password Validation Function
function validatePassword(password) {
    // Password must be at least 5 characters, contain 1 uppercase letter, and 1 number
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{5,}$/;
    return passwordPattern.test(password);
}

async function registerUser() {
    let email = document.getElementById("email").value.trim();
    let nickname = document.getElementById("nickname").value.trim();
    let password = document.getElementById("password").value;

    if (!validatePassword(password)) {
        document.getElementById("error-msg").innerText = "Password must have 5+ characters, 1 uppercase letter, and 1 number.";
        return;
    }

    if (!window.supabase || !window.supabase.auth) {
        console.error("❌ Supabase Auth is not initialized!");
        document.getElementById("error-msg").innerText = "Supabase is not initialized. Please refresh the page.";
        return;
    }

    console.log("🔹 Registering user with Supabase...");

    // ✅ Use Supabase Auth for signup (Handles email confirmation automatically)
    let { data, error } = await window.supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            emailRedirectTo: "dsquizapp://confirm" // Deep linking for app
        }
    });

    if (error) {
        document.getElementById("error-msg").innerText = error.message;
        console.error("❌ Signup Error:", error.message);
        return;
    }

    console.log("✅ User registered:", data);

    // ✅ Store user info in `users` table (WITHOUT PASSWORD)
    let { error: dbError } = await window.supabase.from("users").insert([
        { email: email, nickname: nickname }
    ]);

    if (dbError) {
        document.getElementById("error-msg").innerText = "Error saving user data.";
        console.error("❌ Database Error:", dbError.message);
        return;
    }

    alert("🎉 Registration successful! Please check your email to verify your account before logging in.");
    window.location.href = "login.html";
}
