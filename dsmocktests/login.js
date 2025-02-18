async function loginUser() {
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value;

    if (!window.supabase || !window.supabase.auth) {
        console.error("❌ Supabase Auth is not initialized!");
        document.getElementById("error-msg").innerText = "Supabase is not initialized. Please refresh the page.";
        return;
    }

    console.log("🔹 Logging in user...");

    // ✅ Authenticate user with Supabase
    let { data, error } = await window.supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        if (error.message.includes("Email not confirmed")) {
            document.getElementById("error-msg").innerText = "Please verify your email before logging in. Check your inbox.";
            console.error("❌ Login Error: Email not confirmed");
            return;
        }

        document.getElementById("error-msg").innerText = "Invalid email or password!";
        console.error("❌ Login Error:", error.message);
        return;
    }

    console.log("✅ User logged in:", data.user);

    // ✅ Fetch user details from `users` table (nickname + subscription_status)
    let { data: userData, error: userError } = await window.supabase
        .from("users")
        .select("nickname, subscription_status")
        .eq("email", email)
        .single();

    if (userError) {
        console.warn("⚠️ User exists in auth but not in users table:", userError.message);
        document.getElementById("error-msg").innerText = "User data not found.";
        return;
    }

    console.log("✅ User details fetched:", userData);

    // ✅ Store user details in localStorage
    localStorage.setItem("currentUser", email);
    localStorage.setItem("nickname", userData.nickname);
    localStorage.setItem("subscriptionStatus", userData.subscription_status || "free"); // Default to 'free'

    // ✅ Redirect to dashboard
    window.location.href = "index.html";
}
