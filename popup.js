"use strict";

const ball = document.getElementById("ball");
const answerEl = document.getElementById("answer");
const questionEl = document.getElementById("question");
const inputWrap = document.getElementById("inputWrap");
const askBtn = document.getElementById("askBtn");

const SHAKE_MS = 700;
const EVAPORATE_MS = 900;
const REVEAL_MS = 650;
const LONG_ANSWER_THRESHOLD = 52;

let busy = false;
let lastAnswerIndex = -1;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickAnswer() {
  let index;
  do {
    index = Math.floor(Math.random() * ANSWERS.length);
  } while (index === lastAnswerIndex && ANSWERS.length > 1);
  lastAnswerIndex = index;
  return ANSWERS[index];
}

function setAnswer(text, { scold = false } = {}) {
  answerEl.classList.remove("idle-dot", "fade-out", "reveal", "scold", "long");
  answerEl.textContent = text;
  if (text.length > LONG_ANSWER_THRESHOLD) answerEl.classList.add("long");
  if (scold) answerEl.classList.add("scold");
  // restart the reveal animation even if the class was just removed
  void answerEl.offsetWidth;
  answerEl.classList.add("reveal");
}

function fadeOutCurrentAnswer() {
  answerEl.classList.remove("reveal");
  answerEl.classList.add("fade-out");
}

// Clones the typed text into a ghost layer that floats up and dissolves,
// while the real textarea text turns transparent underneath.
function evaporateInput() {
  const ghost = document.createElement("div");
  ghost.className = "ghost";
  ghost.textContent = questionEl.value;
  ghost.style.animationDuration = `${EVAPORATE_MS}ms`;
  inputWrap.appendChild(ghost);
  questionEl.classList.add("hollow");

  return wait(EVAPORATE_MS).then(() => {
    ghost.remove();
    questionEl.value = "";
    questionEl.classList.remove("hollow");
  });
}

function shakeBall() {
  ball.classList.add("shaking");
  return wait(SHAKE_MS).then(() => ball.classList.remove("shaking"));
}

async function ask() {
  if (busy) return;

  const question = questionEl.value.trim();

  if (!question) {
    // no shake for empty doubts — just a gentle scolding
    busy = true;
    fadeOutCurrentAnswer();
    await wait(250);
    setAnswer(EMPTY_INPUT_MESSAGE, { scold: true });
    await wait(REVEAL_MS);
    busy = false;
    questionEl.focus();
    return;
  }

  busy = true;
  askBtn.disabled = true;
  questionEl.readOnly = true;

  fadeOutCurrentAnswer();
  const evaporated = evaporateInput();
  await shakeBall();
  setAnswer(pickAnswer());
  await Promise.all([evaporated, wait(REVEAL_MS)]);

  questionEl.readOnly = false;
  askBtn.disabled = false;
  busy = false;
  questionEl.focus();
}

askBtn.addEventListener("click", ask);

questionEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    ask();
  }
});

questionEl.focus();
