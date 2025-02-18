document.addEventListener("DOMContentLoaded", async function () {
    try {
        // ✅ Check if user is logged in
        let { data: user, error: authError } = await supabase.auth.getUser();
        if (!user || authError || !user.user) {
            window.location.href = "login.html";
            return;
        }

        let email = user.user.email;
        console.log("📌 Fetching dashboard data for:", email);

        // ✅ Fetch `nickname` from `users` table
        let { data: userInfo, error: userError } = await supabase
            .from("users")
            .select("nickname")
            .eq("email", email)
            .single();

        if (userError) {
            console.error("❌ Error fetching user nickname:", userError.message);
        }

        let nickname = userInfo?.nickname || "User"; // Default to "User" if not found
        document.getElementById("nickname-display").innerText = `Welcome, ${nickname}!`;

        // ✅ Fetch progress from `users_progress` table
        let { data: userData, error: progressError } = await supabase
            .from("users_progress")
            .select("topicProgress, mockTestHistory")
            .eq("email", email)
            .single();

        if (progressError) {
            console.error("❌ Error fetching user progress:", progressError.message);
            return;
        }

        // ✅ Load Mock Test History
        let mockTestHistory = document.getElementById("mockTestHistory");
        mockTestHistory.innerHTML = "";

        if (userData.mockTestHistory && Object.keys(userData.mockTestHistory).length > 0) {
            Object.keys(userData.mockTestHistory).forEach(unit => {
                let score = userData.mockTestHistory[unit];

                mockTestHistory.innerHTML += `
                    <div class="mock-card">
                        <h3>Unit ${unit.replace("unit", "")}</h3>
                        <p><b>Last Score:</b> ${score}%</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${score}%;"></div>
                        </div>
                    </div>`;
            });
        } else {
            mockTestHistory.innerHTML = `<p>No mock test attempts yet.</p>`;
        }

        // ✅ Load Topic Progress
        let topicProgress = document.getElementById("topicProgress");
        topicProgress.innerHTML = "";

        if (userData.topicProgress && Object.keys(userData.topicProgress).length > 0) {
            Object.keys(userData.topicProgress).forEach(unit => {
                Object.keys(userData.topicProgress[unit]).forEach(topic => {
                    let score = userData.topicProgress[unit][topic];

                    topicProgress.innerHTML += `
                        <div class="topic-card">
                            <h3>${topic}</h3>
                            <p><b>Last Score:</b> ${score}%</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${score}%;"></div>
                            </div>
                        </div>`;
                });
            });
        } else {
            topicProgress.innerHTML = `<p>No topic progress recorded.</p>`;
        }

    } catch (err) {
        console.error("❌ Error loading dashboard:", err.message);
    }
});

// ✅ Logout function
async function logout() {
    let { error } = await supabase.auth.signOut();
    if (error) {
        console.error("❌ Logout error:", error.message);
    } else {
        window.location.href = "login.html";
    }
}
