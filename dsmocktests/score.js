// Get parameters from the URL
const urlParams = new URLSearchParams(window.location.search);
const unit = urlParams.get("unit");
const score = parseInt(urlParams.get("score")) || 0;
const total = parseInt(urlParams.get("total")) || 1; // Avoid division by zero
const topic = urlParams.get("topic");

// Calculate percentage score
const percentage = Math.round((score / total) * 100);

// Define pass percentage based on unit
const passThreshold = unit === "unit4" ? 80 : 70; // ✅ 80% for Unit 4, 70% for others
const passFailText = percentage >= passThreshold ? "Pass" : "Fail";
const passFailColor = percentage >= passThreshold ? "#0b9126" : "#FF4C4C";

// Debugging logs
console.log("Unit:", unit);
console.log("Score:", score);
console.log("Total:", total);
console.log("Topic:", topic);
console.log("Percentage:", percentage);

// Save score based on whether it's a topic or mock test
if (unit) {
    saveUserScore(unit, topic, percentage);
}

// Display score and pass/fail status
document.getElementById("score-display").innerText = `You scored ${score} out of ${total} (${percentage}%)`;
document.getElementById("pass-fail").innerText = passFailText;
document.getElementById("pass-fail").style.color = passFailColor;

// Render the score bar with pass threshold
renderScoreBar(percentage, passThreshold);

// Retrieve last quiz data from Supabase for review
fetchLastQuizData();

// Functions for navigation
function goHome() {
    window.location.href = "index.html";
}

function retryQuiz() {
    if (topic) {
        window.location.href = `quiz.html?unit=${unit}&type=topic&topic=${encodeURIComponent(topic)}`;
    } else {
        window.location.href = `quiz.html?unit=${unit}&type=mock`;
    }
}

// Function to render horizontal score bar with a pass threshold
function renderScoreBar(score, passThreshold) {
    let scoreBar = document.getElementById("score-bar");
    let passLine = document.getElementById("pass-line");

    scoreBar.style.width = `${score}%`;
    scoreBar.style.backgroundColor = score >= passThreshold ? "#0b3d91" : "#FF4C4C"; // Dark blue if pass, red if fail
    passLine.style.left = `${passThreshold}%`;
}

// Function to save the quiz score to Supabase
async function saveUserScore(unit, topic, percentage) {
    let { data: user, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
        console.error("User not logged in!");
        return;
    }

    let email = user.user.email;

    // ✅ Fetch user progress from Supabase
    let { data: progressData, error } = await supabase
        .from("users_progress")
        .select("topicProgress, mockTestHistory")
        .eq("email", email)
        .single();

    if (error && error.code !== "PGRST116") { // Ignore "No rows found" error
        console.error("Error fetching user progress:", error.message);
        return;
    }

    // ✅ Initialize progress objects if null
    let updatedTopicProgress = progressData?.topicProgress || {};
    let updatedMockHistory = progressData?.mockTestHistory || {};

    if (topic) {
        updatedTopicProgress[unit] = updatedTopicProgress[unit] || {};
        updatedTopicProgress[unit][topic] = percentage; // Store last topic score
    } else {
        updatedMockHistory[unit] = percentage; // ✅ Append new score
    }

    // ✅ Update Supabase database
    let { error: updateError } = await supabase
        .from("users_progress")
        .upsert({
            email,
            topicProgress: updatedTopicProgress,
            mockTestHistory: updatedMockHistory
        }, { onConflict: ['email'] });

    if (updateError) {
        console.error("❌ Error updating progress:", updateError.message);
    } else {
        console.log("✅ Progress updated successfully!");
    }
}

// Function to retrieve the last quiz data from Supabase
async function fetchLastQuizData() {
    let { data: user, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
        console.error("❌ User not logged in!");
        return;
    }

    let email = user.user.email;
    let { data, error } = await supabase
        .from("last_quiz_data")
        .select("quizData")
        .eq("email", email)
        .single();

    if (error) {
        console.error("❌ Error fetching last quiz data:", error.message);
        return;
    }

    if (data && data.quizData && data.quizData.length > 0) {
        console.log("✅ Last Quiz Data Fetched:", data.quizData);
        displayQuestionReview(data.quizData);
    } else {
        console.warn("⚠️ No previous quiz data found in Supabase!");
    }
}

// Function to display all questions for review
function displayQuestionReview(quizData) {
    let reviewContainer = document.getElementById("question-review");
    reviewContainer.innerHTML = "";

    console.log("🔹 DEBUGGING: Checking retrieved last quiz data");
    console.log(quizData);

    quizData.forEach((q, index) => {
        let isCorrect = q.userAnswer.trim() === q.correctAnswer.trim();
        let questionItem = document.createElement("div");
        questionItem.classList.add("question-item");
        questionItem.style.border = `2px solid ${isCorrect ? "#0b9126" : "#FF4C4C"}`; // Green for correct, red for incorrect

        questionItem.innerHTML = `
            <p><b>Q${index + 1}: ${q.question || "Question not found"}</b></p>
            <p>Your Answer: <span style="color: ${isCorrect ? "#0b9126" : "#FF4C4C"};">${q.userAnswer || "No answer"}</span></p>
            <p>Correct Answer: <b>${q.correctAnswer || "Not Recorded"}</b></p>
        `;
        reviewContainer.appendChild(questionItem);
    });
}

// Fetch quiz data on page load
fetchLastQuizData();
