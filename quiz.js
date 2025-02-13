const urlParams = new URLSearchParams(window.location.search);
let unit = urlParams.get("unit");
let type = urlParams.get("type");
let topic = urlParams.get("topic");
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let totalQuestions = 0;
let timer;
let timeLeft;

// ✅ Function to generate a randomized mock test
function generateMockTest(allQuestions, count) {
    if (allQuestions.length === 0) return [];

    let topics = [...new Set(allQuestions.map(q => q.topic))]; // Unique topics
    let selectedQuestions = [];

    topics.forEach(topic => {
        let topicQuestions = allQuestions.filter(q => q.topic === topic);
        shuffleArray(topicQuestions);
        let perTopic = Math.ceil(count / topics.length);
        selectedQuestions.push(...topicQuestions.slice(0, perTopic));
    });

    shuffleArray(selectedQuestions);
    return selectedQuestions.slice(0, count); // Ensure exact count
}

async function loadQuestions() {
    try {
        if (!unit) {
            alert("Error: No unit selected.");
            return;
        }

        console.log(`📌 Fetching questions for ${unit}, topic: ${topic || "Mock Test"}`);

        let query = supabase.from("qa_data").select("*").eq("unit", unit);

        if (type === "topic" && topic) {
            query = query.eq("topic", topic);
        }

        let { data: allQuestions, error } = await query;
        if (error) throw error;
        if (!allQuestions || allQuestions.length === 0) {
            alert("No questions found for this unit.");
            return;
        }

        questions = allQuestions.map(q => ({
            question: q.question || "Missing question",
            options: [q.answer1, q.answer2, q.answer3, q.answer4],
            correct: q.answer,
            topic: q.topic,
            userAnswer: null 
        }));

        if (type.startsWith("mock")) {
            let questionCount = { unit1: 72, unit2: 50, unit3: 20, unit4: 30 }[unit];
            questions = generateMockTest(questions, questionCount);
            document.getElementById("timer").style.display = "block";
            startTimer();
        }

        totalQuestions = questions.length;
        loadQuestion();
    } catch (error) {
        console.error("❌ Error loading questions:", error.message);
        alert("Error loading questions. Please check the database.");
    }
}

function startTimer() {
    let timeLimits = { unit1: 110, unit2: 75, unit3: 30, unit4: 45 };
    timeLeft = (timeLimits[unit] || 60) * 60;
    updateTimerDisplay();
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            showScore();
        } else {
            timeLeft--;
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById("timer").innerText = `Time Left: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        document.querySelector(".score-button").style.display = "block";
        clearInterval(timer);
        return;
    }

    let questionData = questions[currentQuestionIndex];
    document.getElementById("question-counter").innerText = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
    document.getElementById("question-text").innerText = questionData.question;

    let answersDiv = document.getElementById("answers");
    answersDiv.innerHTML = "";

    questionData.options.forEach(option => {
        let btn = document.createElement("button");
        btn.innerText = option;
        btn.classList.add("answer-btn");
        btn.onclick = function () { checkAnswer(btn, option, questionData.correct); };
        answersDiv.appendChild(btn);
    });

    document.querySelector(".next-button").style.display = "none";
}

function checkAnswer(button, selected, correct) {
    let buttons = document.querySelectorAll(".answer-btn");
    buttons.forEach(btn => btn.disabled = true);

    questions[currentQuestionIndex].userAnswer = selected;

    if (selected === correct) {
        button.classList.add("correct");
        score++;
    } else {
        button.classList.add("wrong");
        buttons.forEach(btn => {
            if (btn.innerText === correct) btn.classList.add("correct");
        });
    }
    document.querySelector(".next-button").style.display = "block";
}

function nextQuestion() {
    currentQuestionIndex++;
    document.querySelector(".next-button").style.display = "none";
    loadQuestion();
}

function exitQuiz() {
    window.location.href = `${unit}.html`;
}

// ✅ Save last score in `users_progress`
async function showScore() {
    let scorePercentage = Math.round((score / totalQuestions) * 100);
    let scoreUrl = `score.html?unit=${unit}&score=${score}&total=${totalQuestions}`;
    if (type === "topic" && topic) {
        scoreUrl += `&topic=${encodeURIComponent(topic)}`;
    }

    let { data: user, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
        console.error("❌ User not logged in!");
        return;
    }

    let email = user.user.email;

    // ✅ Fetch user progress from Supabase
    let { data: userProgress, error: progressError } = await supabase
        .from("users_progress")
        .select("topicProgress, mockTestHistory")
        .eq("email", email)
        .single();

    if (progressError && progressError.code !== "PGRST116") {
        console.error("❌ Error fetching user progress:", progressError.message);
        return;
    }

    let mockTestHistory = userProgress?.mockTestHistory || {};
    let topicProgress = userProgress?.topicProgress || {};

    if (type === "topic" && topic) {
        topicProgress[unit] = topicProgress[unit] || {};
        topicProgress[unit][topic] = scorePercentage;
    } else {
        mockTestHistory[unit] = scorePercentage;
    }

    // ✅ Create or Update `last_quiz_data`
    let lastQuizData = questions.map(q => ({
        question: q.question,
        userAnswer: q.userAnswer || "No answer",
        correctAnswer: q.correct
    }));

    let { error: saveQuizError } = await supabase
        .from("last_quiz_data")
        .upsert([
            {
                email,
                quizData: lastQuizData
            }
        ], { onConflict: ["email"] });

    if (saveQuizError) {
        console.error("❌ Error saving last quiz data:", saveQuizError.message);
    } else {
        console.log("✅ Last quiz data saved successfully!");
    }

    // ✅ Update `users_progress`
    let { error: saveProgressError } = await supabase
        .from("users_progress")
        .upsert([
            {
                email,
                mockTestHistory,
                topicProgress
            }
        ], { onConflict: ["email"] });

    if (saveProgressError) {
        console.error("❌ Error saving progress:", saveProgressError.message);
    } else {
        console.log("✅ Progress saved successfully!");
    }

    window.location.href = scoreUrl;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

window.onload = loadQuestions;