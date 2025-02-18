document.addEventListener("DOMContentLoaded", async function () {
    let unit = document.body.getAttribute("data-unit");
    if (!unit) {
        console.error("❌ Unit not specified!");
        return;
    }

    console.log(`📌 Loading questions for ${unit}...`);

    // ✅ Get logged-in user
    let { data: user, error: authError } = await supabase.auth.getUser();
    if (!user || authError || !user.user) {
        console.error("❌ User not logged in!");
        window.location.href = "login.html";
        return;
    }

    let email = user.user.email;
    console.log("📌 Fetching progress for:", email);

    // ✅ Fetch user subscription status
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

    // ✅ Show Upgrade Button Only for Free Users
    let upgradeContainer = document.getElementById("upgrade-container");
    if (!isPremium && upgradeContainer) {
        upgradeContainer.style.display = "block";
    } else if (upgradeContainer) {
        upgradeContainer.style.display = "none"; // Hide for premium users
    }

    // ✅ Fetch user progress from `users_progress`
    let { data: progressData, error: progressError } = await supabase
        .from("users_progress")
        .select("mockTestHistory, topicProgress")
        .eq("email", email)
        .single();

    if (progressError) {
        console.error("⚠️ Error fetching user progress:", progressError.message);
        progressData = { mockTestHistory: {}, topicProgress: {} }; // Default empty progress
    }

    let mockTestHistory = progressData?.mockTestHistory || {}; // Ensure data exists
    let hasAttemptedMock = mockTestHistory[unit] !== undefined; // ✅ Check if mock test was attempted

    console.log(`📌 Has attempted mock test for ${unit}:`, hasAttemptedMock);

    // ✅ Lock only the Mock Test button without removing others
    updateMockTestButton(unit, isPremium, hasAttemptedMock);

    // ✅ Fetch and display topics with questions from `qa_data`
    fetchQuestions(unit, isPremium, progressData.topicProgress);

});

// ✅ Restore `fetchQuestions` (Now applies subscription rules)
async function fetchQuestions(unit, isPremium, topicProgress) {
    try {
        let { data: questions, error } = await supabase
            .from("qa_data")
            .select("question, topic")
            .eq("unit", unit);

        if (error) throw error;
        if (!questions || questions.length === 0) {
            console.warn("⚠️ No questions found for this unit.");
            return;
        }

        let topicCounts = countQuestionsByTopic(questions);
        let topics = getTopicsByUnit(unit);
        displayTopics(unit, topics, topicCounts, topicProgress, isPremium);
    } catch (error) {
        console.error("❌ Error fetching questions:", error);
    }
}

// ✅ Count questions per topic
function countQuestionsByTopic(questions) {
    let topicCounts = {};
    questions.forEach(q => {
        topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    });
    return topicCounts;
}

// ✅ Retrieve topics by unit
function getTopicsByUnit(unit) {
    let topicList = {
        "unit1": ["Understanding the Private Security Industry", "Key Legislation for Security Operatives", "Arrest Powers and Procedures", "Safe Working Practices in Security", "Fire Safety and Emergency Procedures", "Handling Workplace Emergencies", "Effective Communication in Security", "Accurate Record-Keeping and Reporting", "Recognising and Responding to Terror Threats", "Protecting Vulnerable People in Security", "Post-Incident Procedures and Management"],
        "unit2": ["Recognising and Responding to Crimes in Door Supervision", "Conducting Effective Search Procedures", "Drug Misuse Laws and Procedures for Door Supervisors", "Preserving Evidence: Best Practices for Door Supervisors", "Licensing Laws and Compliance in Door Supervision", "Managing Queues and Venue Capacity Effectively", "Essential Equipment Use for Door Supervisors"],
        "unit3": ["Key Principles of Conflict Management for Door Supervisors", "Recognising Assessing and Minimising Risk in Conflict Situations", "Effective Problem-Solving Techniques for Conflict Resolution"],
        "unit4": ["Principles and Legal Considerations of Physical Intervention", "Recognising the Risks of Physical Intervention", "Minimising Risks in Physical Intervention"]
    };
    return topicList[unit] || [];
}

// ✅ Display topics and user progress (with premium locks 🔒)
function displayTopics(unit, topics, topicCounts, topicProgress, isPremium) {
    let topicsList = document.getElementById("topicsList");
    topicsList.innerHTML = "";

    let freeTopicsLimit = 2; // Free users can access 2 topics per unit
    let freeTopics = topics.slice(0, freeTopicsLimit); // First 2 topics

    topics.forEach((topic, index) => {
        let totalQuestions = topicCounts[topic] || 0;
        let progressPercentage = topicProgress[unit]?.[topic] !== undefined ? parseFloat(topicProgress[unit][topic]).toFixed(1) : "0.0";

        console.log(`📌 Progress for "${topic}": ${progressPercentage}%`);

        let topicItem = document.createElement("div");
        topicItem.classList.add("topic-item");

        // Lock content for free users
        let isLocked = !isPremium && !freeTopics.includes(topic);

        topicItem.innerHTML = `
            <div class="topic-title">
                ${topic} <br>
                <span style="font-size: 0.8em; opacity: 0.8;">(${totalQuestions} Questions)</span>
            </div>
            <div class="score-container">
                <div class="score-label">Score</div>
                <div class="score-value">${progressPercentage}%</div>
                <div class="score-status">${isLocked ? "🔒 Locked" : "Correct"}</div>
            </div>
        `;

        topicItem.onclick = function () {
            if (isLocked) {
                alert("🔒 This topic is only available for Premium users. Upgrade to unlock!");
                window.location.href = "upgrade.html"; // Redirect to upgrade page
            } else {
                startTopicQuiz(unit, topic);
            }
        };

        topicsList.appendChild(topicItem);
    });
}

// ✅ Lock/Unlock Mock Test Button (Without Removing Other Buttons)
function updateMockTestButton(unit, isPremium, hasAttemptedMock) {
    let mockTestButton = document.querySelector(".container .button"); // ✅ Select ONLY the mock test button
    if (!mockTestButton) {
        console.error("❌ Mock Test button not found in the container!");
        return;
    }

    if (isPremium || !hasAttemptedMock) {
        mockTestButton.innerText = "Start Mock Test";
        mockTestButton.style.backgroundColor = "#0b3d91"; // Keep original button color
        mockTestButton.style.cursor = "pointer";
        mockTestButton.disabled = false;
        mockTestButton.onclick = function () {
            startMockTest(unit);
        };
    } else {
        mockTestButton.innerText = "🔒 Upgrade for More Mock Tests";
        mockTestButton.style.backgroundColor = "#ccc"; // Greyed out to indicate locked
        mockTestButton.style.cursor = "not-allowed";
        mockTestButton.disabled = true; // Prevent clicking
    }
}

// ✅ Start Topic Quiz
function startTopicQuiz(unit, topic) {
    window.location.href = `quiz.html?unit=${encodeURIComponent(unit)}&type=topic&topic=${encodeURIComponent(topic)}`;
}

// ✅ Start Mock Test Function
function startMockTest(unit) {
    const mockTestConfig = {
        unit1: 72,
        unit2: 50,
        unit3: 20,
        unit4: 30
    };

    let numQuestions = mockTestConfig[unit];

    window.location.href = `quiz.html?unit=${unit}&type=mock&numQuestions=${numQuestions}`;
}

// ✅ Function to Open Q&A Section
function openQASection() {
    let unit = document.body.getAttribute("data-unit");
    if (unit) {
        window.location.href = `qa.html?unit=${encodeURIComponent(unit)}`;
    } else {
        console.error("❌ Unit not specified!");
    }
}
