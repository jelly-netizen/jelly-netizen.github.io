/* ==========================================================
  10 minute quiz starts when user clicks Start
  Graded on submit
  Shows pass/fail, total score, time spent and results
  Scores and corrects answers for every question
  retake ckears all answers
  ========================================================== */

// ---------- Settings ----------

const QUIZ_SECONDS = 10 * 60;   // time limit: 10 minutes
const PASS_SCORE = 7;           // points needed to pass (out of 10)

/* Answer key, one entry per question (the key matches the fieldset id).
   - text:     "accepted" lists every answer we count as correct, written in
               the simplified form produced by normalize() below
   - radio:    "answer" is the value of the one correct choice
   - checkbox: "answers" lists the values of all correct choices
   "display" is what we show the user as the correct answer. */
const ANSWER_KEY = {
    q1:  { type: "text", accepted: ["tim berners lee", "berners lee"], display: "Tim Berners-Lee" },
    q2:  { type: "radio", answer: "mosaic" },
    q3:  { type: "radio", answer: "ie" },
    q4:  { type: "checkbox", answers: ["edge", "opera", "brave"] },
    q5:  { type: "radio", answer: "webkit" },
    q6:  { type: "text", accepted: ["domain name system"], display: "Domain Name System" },
    q7:  { type: "radio", answer: "encryption" },
    q8:  { type: "checkbox", answers: ["http", "tcp", "dns"] },
    q9:  { type: "text", accepted: ["v8", "v8 engine"], display: "V8" },
    q10: { type: "radio", answer: "native" }
};


// ---------- Page elements ----------

const form = document.getElementById("quiz-form");
const intro = document.getElementById("quiz-intro");
const timerBox = document.getElementById("quiz-timer");
const timeLeftText = document.getElementById("time-left");
const resultsBox = document.getElementById("quiz-results");
const startButton = document.getElementById("start-btn");
const submitButton = document.getElementById("submit-btn");
const retakeButton = document.getElementById("retake-btn");


// ---------- Quiz state ----------

let startTime = 0;       // when the current attempt started (milliseconds)
let timerId = null;      // id from setInterval, so the timer can be stopped
let submitted = false;   // stops the quiz from being graded twice


// ---------- Helpers ----------

// Turns a number of seconds into "m:ss", for example 75 -> "1:15"
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ":" + String(seconds).padStart(2, "0");
}

// Seconds since the quiz started, never more than the time limit
function secondsElapsed() {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    return Math.min(seconds, QUIZ_SECONDS);
}

/* Simplifies a typed answer so small differences don't matter:
   "  Tim Berners-Lee. " -> "tim berners lee" */
function normalize(text) {
    return text
        .toLowerCase()
        .replace(/[-_]/g, " ")      // hyphens and underscores become spaces
        .replace(/[^a-z0-9 ]/g, "") // drop punctuation
        .replace(/\s+/g, " ")       // collapse repeated spaces
        .trim();
}

// Finds the visible label text for a radio button or checkbox value
function labelFor(questionId, value) {
    const input = form.querySelector(`input[name="${questionId}"][value="${value}"]`);
    return input.parentElement.textContent.trim();
}

// Escapes text before putting it into HTML, so typed answers display as plain text
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


// ---------- Timer ----------

// Runs once a second: updates the countdown and submits when time is up
function updateTimer() {
    const secondsLeft = QUIZ_SECONDS - secondsElapsed();
    timeLeftText.textContent = formatTime(secondsLeft);

    // Turn the timer red during the last minute
    timerBox.classList.toggle("warning", secondsLeft <= 60);

    if (secondsLeft <= 0) {
        gradeQuiz(true);
    }
}

function startQuiz() {
    intro.hidden = true;
    form.hidden = false;
    timerBox.hidden = false;

    submitted = false;
    startTime = Date.now();
    updateTimer();
    timerId = setInterval(updateTimer, 1000);

    form.querySelector("input").focus();
}


// ---------- Grading ----------

/* Reads the user's answer for one question.
   Returns a string for text and radio questions, or an array for checkboxes. */
function getUserAnswer(questionId, type) {
    if (type === "text") {
        return form.querySelector(`input[name="${questionId}"]`).value.trim();
    }
    if (type === "radio") {
        const checked = form.querySelector(`input[name="${questionId}"]:checked`);
        return checked ? checked.value : "";
    }
    // checkbox: collect the value of every checked box
    const checked = form.querySelectorAll(`input[name="${questionId}"]:checked`);
    return Array.from(checked, box => box.value);
}

// Returns true if the user's answer matches the answer key
function isCorrect(key, userAnswer) {
    if (key.type === "text") {
        return key.accepted.includes(normalize(userAnswer));
    }
    if (key.type === "radio") {
        return userAnswer === key.answer;
    }
    // checkbox: must select every correct choice and nothing else
    return userAnswer.length === key.answers.length &&
           key.answers.every(value => userAnswer.includes(value));
}

// Turns an answer into readable text for the results
function describeAnswer(questionId, key, answer) {
    if (key.type === "text") {
        return answer;
    }
    if (key.type === "radio") {
        return answer ? labelFor(questionId, answer) : "";
    }
    return answer.map(value => labelFor(questionId, value)).join(", ");
}

// Grades every question and shows the results.
// timedOut is true when the timer ran out instead of the user clicking Submit.
function gradeQuiz(timedOut) {
    if (submitted) {
        return;
    }
    submitted = true;
    clearInterval(timerId);

    const timeSpent = secondsElapsed();
    let score = 0;
    const rows = [];

    for (const [questionId, key] of Object.entries(ANSWER_KEY)) {
        const fieldset = document.getElementById(questionId);
        const userAnswer = getUserAnswer(questionId, key.type);
        const correct = isCorrect(key, userAnswer);
        const points = correct ? 1 : 0;
        score += points;

        // The correct answer in readable form
        let correctText = key.display;
        if (key.type === "radio") {
            correctText = labelFor(questionId, key.answer);
        } else if (key.type === "checkbox") {
            correctText = describeAnswer(questionId, key, key.answers);
        }
        const userText = describeAnswer(questionId, key, userAnswer) || "No answer";

        // Color the question green or red and explain the result under it
        fieldset.classList.add(correct ? "correct" : "incorrect");
        fieldset.querySelector(".feedback").innerHTML = correct
            ? `<strong>Correct</strong> &ndash; ${points}/1 point`
            : `<strong>Incorrect</strong> &ndash; ${points}/1 point. Correct answer: ${escapeHtml(correctText)}`;

        // Save a row for the results table
        rows.push(`
            <tr class="${correct ? "correct" : "incorrect"}">
                <td>${questionId.slice(1)}</td>
                <td>${escapeHtml(userText)}</td>
                <td>${escapeHtml(correctText)}</td>
                <td>${correct ? "Correct" : "Incorrect"}</td>
                <td class="num">${points}/1</td>
            </tr>`);
    }

    // Lock the answers so they can't be changed after grading
    form.querySelectorAll("fieldset").forEach(fieldset => fieldset.disabled = true);
    submitButton.hidden = true;
    retakeButton.hidden = false;
    timerBox.hidden = true;

    showResults(score, timeSpent, timedOut, rows);
}

// Builds the results panel at the top of the quiz
function showResults(score, timeSpent, timedOut, rows) {
    const total = Object.keys(ANSWER_KEY).length;
    const passed = score >= PASS_SCORE;
    const percent = Math.round((score / total) * 100);

    resultsBox.className = "quiz-results " + (passed ? "pass" : "fail");
    resultsBox.innerHTML = `
        <h2>${passed ? "You passed!" : "You did not pass"}</h2>
        ${timedOut ? '<p class="note">Time ran out, so your quiz was submitted automatically.</p>' : ""}

        <div class="result-stats">
            <div class="stat">
                <span class="stat-label">Result</span>
                <span class="stat-value">${passed ? "Pass" : "Fail"}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Score</span>
                <span class="stat-value">${score} / ${total} (${percent}%)</span>
            </div>
            <div class="stat">
                <span class="stat-label">Time spent</span>
                <span class="stat-value">${formatTime(timeSpent)}</span>
            </div>
        </div>

        <div class="table-wrap">
            <table class="results-table">
                <caption>Results by question (pass mark: ${PASS_SCORE}/${total})</caption>
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Your answer</th>
                        <th scope="col">Correct answer</th>
                        <th scope="col">Result</th>
                        <th scope="col" class="num">Score</th>
                    </tr>
                </thead>
                <tbody>${rows.join("")}</tbody>
            </table>
        </div>`;

    resultsBox.hidden = false;
    resultsBox.scrollIntoView({ behavior: "smooth" });
}


// ---------- Retake ----------

// Clears every answer and result, then starts a new attempt with a fresh timer
function resetQuiz() {
    clearInterval(timerId);
    form.reset();

    form.querySelectorAll("fieldset").forEach(fieldset => {
        fieldset.disabled = false;
        fieldset.classList.remove("correct", "incorrect");
        fieldset.querySelector(".feedback").innerHTML = "";
    });

    resultsBox.hidden = true;
    resultsBox.innerHTML = "";
    submitButton.hidden = false;
    retakeButton.hidden = true;

    window.scrollTo({ top: 0, behavior: "smooth" });
    startQuiz();
}


// ---------- Event listeners ----------

startButton.addEventListener("click", startQuiz);
retakeButton.addEventListener("click", resetQuiz);

// Stop the form from reloading the page, and grade it instead
form.addEventListener("submit", event => {
    event.preventDefault();
    gradeQuiz(false);
});
