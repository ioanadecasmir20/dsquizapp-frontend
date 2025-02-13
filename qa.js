async function fetchAndDisplayQA(unit) {
    let { data: user, error: authError } = await supabase.auth.getUser();
    if (!user || authError || !user.user) {
        console.error("❌ User not logged in!");
        window.location.href = "login.html";
        return;
    }

    let email = user.user.email;

    // ✅ Fetch user subscription status from Supabase
    let { data: userData, error: userError } = await supabase
        .from("users")
        .select("subscription_status")
        .eq("email", email)
        .single();

    if (userError) {
        console.error("⚠️ Error fetching user subscription:", userError.message);
        return;
    }

    let isPremium = userData?.subscription_status === "premium"; // ✅ Check if user is premium

    console.log(`📌 User is ${isPremium ? "Premium" : "Free"}`);

    // ✅ Fetch Q&A Data
    let { data: questions, error } = await supabase
        .from("qa_data")
        .select("topic, question, answer1, answer2, answer3, answer4, answer, explanation")
        .eq("unit", unit);

    if (error) {
        console.error("❌ Error loading Q&A:", error.message);
        return;
    }

    let qaContainer = document.getElementById("qa-content");
    qaContainer.innerHTML = "";

    let topics = [...new Set(questions.map(q => q.topic))];

    // ✅ If Free User, Limit Topics
    let freeTopics = isPremium ? topics : topics.slice(0, 2); // Only allow first 2 topics for free users

    topics.forEach(topic => {
        let isLocked = !isPremium && !freeTopics.includes(topic); // ✅ Lock topics beyond the first 2

        let topicSection = document.createElement("div");
        topicSection.classList.add("topic-section");

        let dropdown = document.createElement("button");
        dropdown.classList.add("dropdown");
        dropdown.innerText = topic;

        let dropdownContent = document.createElement("div");
        dropdownContent.classList.add("dropdown-content");

        if (isLocked) {
            dropdown.classList.add("locked");
            dropdown.innerHTML += " 🔒"; // Show Lock Icon
            dropdown.disabled = true; // Disable dropdown for locked topics
        } else {
            dropdown.onclick = function () {
                let content = this.nextElementSibling;
                content.style.display = content.style.display === "block" ? "none" : "block";
            };

            questions
                .filter(q => q.topic === topic)
                .forEach(q => {
                    let qElem = document.createElement("div");
                    qElem.classList.add("question");
                    qElem.innerHTML = `<b>Q:</b> ${q.question}`;

                    let correctElem = document.createElement("div");
                    correctElem.classList.add("correct-answer");
                    correctElem.innerHTML = `<b>Correct Answer:</b> ${q.answer}`;

                    let eElem = document.createElement("div");
                    eElem.classList.add("explanation");
                    eElem.innerHTML = `<b>Explanation:</b> ${q.explanation || "To be added"}`;

                    dropdownContent.innerHTML += qElem.outerHTML + correctElem.outerHTML + eElem.outerHTML;
                });
        }

        topicSection.appendChild(dropdown);
        topicSection.appendChild(dropdownContent);
        qaContainer.appendChild(topicSection);
    });

    if (!isPremium) {
        let upgradeMessage = document.createElement("p");
        upgradeMessage.innerHTML = `🔒 Upgrade to Premium to access all topics.`;
        upgradeMessage.classList.add("upgrade-message");
        qaContainer.appendChild(upgradeMessage);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const unit = urlParams.get("unit");

    if (!unit) {
        alert("Error: No unit selected.");
        return;
    }

    document.getElementById("unit-title").innerText = `Unit ${unit.replace(/\D/g, '')} - Q&A`;
    fetchAndDisplayQA(unit);
});

// ✅ Function to navigate back to the previous page
function goBack() {
    window.history.back();
}

// ✅ Ensure this function is accessible globally
window.goBack = goBack;