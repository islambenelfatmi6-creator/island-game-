"use strict";

/* =====================================
   ISLAND GAME - MAIN JAVASCRIPT
   12 games, coins, XP, favorites,
   achievements, backup and progress
===================================== */

const $ = (selector) => document.querySelector(selector);

const games = [
  { id: "xo", name: "Tic Tac Toe", icon: "⭕", category: "puzzle", description: "Play XO against the computer." },
  { id: "reaction", name: "Reaction Test", icon: "⚡", category: "arcade", description: "Test how fast you can react." },
  { id: "target", name: "Target Shooter", icon: "🎯", category: "arcade", description: "Hit the targets and score points." },
  { id: "memory", name: "Memory Match", icon: "🧠", category: "puzzle", description: "Find matching pairs of cards." },
  { id: "snake", name: "Snake", icon: "🐍", category: "arcade", description: "Eat food and grow your snake." },
  { id: "guess", name: "Guess Number", icon: "🔢", category: "puzzle", description: "Find the hidden number." },
  { id: "rps", name: "Rock Paper Scissors", icon: "✊", category: "arcade", description: "Challenge the computer." },
  { id: "math", name: "Math Challenge", icon: "➗", category: "puzzle", description: "Solve calculations against time." },
  { id: "racer", name: "Dodge Racer", icon: "🏎️", category: "arcade", description: "Avoid obstacles on the road." },
  { id: "flappy", name: "Flappy Bird", icon: "🐦", category: "arcade", description: "Fly between the obstacles." },
  { id: "shooter", name: "Space Shooter", icon: "🚀", category: "arcade", description: "Shoot enemies in space." },
  { id: "breakout", name: "Brick Breaker", icon: "🧱", category: "arcade", description: "Break the bricks with your ball." }
];

const defaultState = {
  coins: 0,
  xp: 0,
  level: 1,
  favorites: [],
  scores: {},
  achievements: [],
  played: []
};

let state = loadState();
let activeFilter = "all";
let activeGame = null;
let cleanupGame = null;
let toastTimeout = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("islandGameSave"));
    return saved ? { ...defaultState, ...saved } : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem("islandGameSave", JSON.stringify(state));
  updateStats();
}

function toast(message) {
  const element = $("#toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    element.classList.remove("show");
  }, 2300);
}

function updateStats() {
  state.level = Math.floor(state.xp / 100) + 1;

  $("#coins").textContent = state.coins;
  $("#level").textContent = state.level;
  $("#xp").textContent = state.xp;

  const progress = state.xp % 100;
  $("#xpProgress").style.width = progress + "%";

  renderAchievements();
}

function addReward(points = 10) {
  state.xp += points;
  state.coins += Math.max(1, Math.floor(points / 2));

  const unlocked = [];

  if (!state.achievements.includes("first")) {
    state.achievements.push("first");
    unlocked.push("First Game");
  }

  if (state.played.length >= 5 &&
      !state.achievements.includes("five")) {
    state.achievements.push("five");
    unlocked.push("Explorer");
  }

  if (state.coins >= 100 &&
      !state.achievements.includes("rich")) {
    state.achievements.push("rich");
    unlocked.push("Coin Collector");
  }

  saveState();

  if (unlocked.length) {
    toast("🏆 Achievement: " + unlocked.join(", "));
  } else {
    toast("+" + points + " XP and +" +
      Math.max(1, Math.floor(points / 2)) + " coins!");
  }
}

const achievementList = [
  { id: "first", name: "🎮 First Game" },
  { id: "five", name: "🧭 Explorer" },
  { id: "rich", name: "🪙 Coin Collector" }
];

function renderAchievements() {
  const container = $("#achievements");
  if (!container) return;

  container.innerHTML = achievementList.map(item => `
    <div class="achievement ${
      state.achievements.includes(item.id) ? "unlocked" : ""
    }">
      ${item.name}
      ${state.achievements.includes(item.id) ? " ✓" : " 🔒"}
    </div>
  `).join("");
}

function renderGames() {
  const grid = $("#gamesGrid");
  const search = ($("#searchInput").value || "").toLowerCase();

  const filtered = games.filter(game => {
    const matchesSearch =
      game.name.toLowerCase().includes(search) ||
      game.description.toLowerCase().includes(search);

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "favorite" &&
        state.favorites.includes(game.id)) ||
      game.category === activeFilter;

    return matchesSearch && matchesFilter;
  });

  if (!filtered.length) {
    grid.innerHTML =
      '<p class="game-message">No games found.</p>';
    return;
  }

  grid.innerHTML = filtered.map(game => `
    <article class="game-card">
      <div class="game-cover">${game.icon}</div>
      <div class="game-info">
        <h3>${game.name}</h3>
        <p>${game.description}</p>
        <div class="game-actions">
          <button class="play-btn" data-play="${game.id}">
            ▶ Play
          </button>
          <button class="favorite-btn ${
            state.favorites.includes(game.id) ? "active" : ""
          }" data-favorite="${game.id}" aria-label="Favorite">
            ${state.favorites.includes(game.id) ? "♥" : "♡"}
          </button>
        </div>
        <p style="margin-top:12px;margin-bottom:0">
          🏆 Best: ${state.scores[game.id] || 0}
        </p>
      </div>
    </article>
  `).join("");
}

$("#gamesGrid").addEventListener("click", event => {
  const playButton = event.target.closest("[data-play]");
  const favoriteButton = event.target.closest("[data-favorite]");

  if (playButton) {
    openGame(playButton.dataset.play);
  }

  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;

    if (state.favorites.includes(id)) {
      state.favorites = state.favorites.filter(item => item !== id);
    } else {
      state.favorites.push(id);
    }

    saveState();
    renderGames();
  }
});

$("#searchInput").addEventListener("input", renderGames);

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderGames();
  });
});

function openGame(id) {
  const game = games.find(item => item.id === id);
  if (!game) return;

  closeGame();

  activeGame = id;
  $("#gameTitle").textContent = game.icon + " " + game.name;
  $("#gameModal").classList.remove("hidden");

  if (!state.played.includes(id)) {
    state.played.push(id);
  }

  saveState();
  startGame(id);
}

function closeGame() {
  if (typeof cleanupGame === "function") {
    cleanupGame();
  }

  cleanupGame = null;
  activeGame = null;
  $("#gameArea").innerHTML = "";
  $("#gameModal").classList.add("hidden");
}

$("#closeGame").addEventListener("click", closeGame);

$("#gameModal").addEventListener("click", event => {
  if (event.target.id === "gameModal") closeGame();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeGame();
});

function startGame(id) {
  const area = $("#gameArea");

  switch (id) {
    case "xo": return gameXO(area);
    case "reaction": return gameReaction(area);
    case "target": return gameTarget(area);
    case "memory": return gameMemory(area);
    case "snake": return gameSnake(area);
    case "guess": return gameGuess(area);
    case "rps": return gameRPS(area);
    case "math": return gameMath(area);
    case "racer": return gameRacer(area);
    case "flappy": return gameFlappy(area);
    case "shooter": return gameShooter(area);
    case "breakout": return gameBreakout(area);
  }
}

function finishGame(score, reward = true) {
  if (!activeGame) return;

  const id = activeGame;
  const best = state.scores[id] || 0;

  if (score > best) {
    state.scores[id] = score;
  }

  saveState();
  renderGames();

  if (reward && score > 0) {
    addReward(Math.max(5, Math.min(50, score)));
  }
}

/* 1. TIC TAC TOE */

function gameXO(area) {
  area.innerHTML = `
    <p class="game-message" id="xoMessage">Your turn: X</p>
    <div class="game-board" id="xoBoard"></div>
    <button id="xoRestart">Restart</button>
  `;

  let board = Array(9).fill("");
  let ended = false;
  const boardElement = $("#xoBoard");
  const message = $("#xoMessage");

  function draw() {
    boardElement.innerHTML = board.map((value, i) => `
      <button class="game-cell" data-index="${i}">
        ${value}
      </button>
    `).join("");
  }

  function winner() {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    return lines.find(line =>
      board[line[0]] &&
      board[line[0]] === board[line[1]] &&
      board[line[1]] === board[line[2]]
    );
  }

  function check() {
    if (winner()) {
      ended = true;
      const who = board[winner()[0]];
      message.textContent = who === "X"
        ? "🎉 You win!"
        : "Computer wins!";
      if (who === "X") finishGame(20);
      return true;
    }

    if (board.every(Boolean)) {
      ended = true;
      message.textContent = "Draw!";
      return true;
    }

    return false;
  }

  boardElement.addEventListener("click", event => {
    const cell = event.target.closest("[data-index]");
    if (!cell || ended) return;

    const i = Number(cell.dataset.index);
    if (board[i]) return;

    board[i] = "X";
    draw();

    if (check()) return;

    const available = board
      .map((value, index) => value ? -1 : index)
      .filter(index => index !== -1);

    const move = available[Math.floor(Math.random() * available.length)];
    board[move] = "O";
    draw();

    if (!check()) message.textContent = "Your turn: X";
  });

  $("#xoRestart").addEventListener("click", () => gameXO(area));
  draw();
}

/* 2. REACTION TEST */

function gameReaction(area) {
  area.innerHTML = `
    <p class="game-message" id="reactionMessage">
      Press Start, then tap when the screen turns green.
    </p>
    <button id="reactionStart">Start</button>
    <button id="reactionBox" disabled style="
      display:block;width:100%;min-height:180px;
      margin-top:15px;background:#71394a;color:white;
      font-size:24px;border-radius:18px">
      Wait...
    </button>
  `;

  let timer;
  let startTime = 0;
  let ready = false;
  let finished = false;

  const box = $("#reactionBox");
  const message = $("#reactionMessage");

  $("#reactionStart").addEventListener("click", () => {
    clearTimeout(timer);
    ready = false;
    finished = false;
    box.disabled = false;
    box.style.background = "#71394a";
    box.textContent = "Wait for green...";
    message.textContent = "Get ready!";

    timer = setTimeout(() => {
      if (!activeGame) return;
      ready = true;
      startTime = performance.now();
      box.style.background = "#087f5b";
      box.textContent = "TAP NOW!";
    }, 1200 + Math.random() * 3000);
  });

  box.addEventListener("click", () => {
    if (finished) return;

    if (!ready) {
      clearTimeout(timer);
      finished = true;
      box.disabled = true;
      message.textContent = "Too early! Try again.";
      return;
    }

    finished = true;
    ready = false;
    const ms = Math.round(performance.now() - startTime);
    message.textContent = "Your reaction: " + ms + " ms";

    if (ms < 350) finishGame(Math.max(5, 350 - ms));
    box.disabled = true;
  });

  cleanupGame = () => clearTimeout(timer);
}

/* 3. TARGET SHOOTER */

function gameTarget(area) {
  area.innerHTML = `
    <p class="game-message" id="targetScore">Score: 0 | Time: 20</p>
    <div id="targetField" style="
      position:relative;height:320px;overflow:hidden;
      background:#071b2b;border-radius:15px">
      <button id="targetDot" style="
        position:absolute;width:52px;height:52px;border-radius:50%;
        background:#ff5263;color:white;font-size:25px;padding:0">
        🎯
      </button>
    </div>
    <button id="targetStart">Start Game</button>
  `;

  const field = $("#targetField");
  const dot = $("#targetDot");
  const label = $("#targetScore");
  let score = 0;
  let time = 20;
  let interval = null;
  let playing = false;

  function move() {
    dot.style.left = Math.random() *
      Math.max(0, field.clientWidth - 55) + "px";
    dot.style.top = Math.random() *
      Math.max(0, field.clientHeight - 55) + "px";
  }

  $("#targetStart").addEventListener("click", () => {
    clearInterval(interval);
    score = 0;
    time = 20;
    playing = true;
    dot.disabled = false;
    move();
    label.textContent = "Score: 0 | Time: 20";

    interval = setInterval(() => {
      time--;
      label.textContent = `Score: ${score} | Time: ${time}`;

      if (time <= 0) {
        clearInterval(interval);
        playing = false;
        dot.disabled = true;
        label.textContent = `Finished! Score: ${score}`;
        finishGame(score);
      }
    }, 1000);
  });

  dot.addEventListener("click", () => {
    if (!playing) return;
    score++;
    label.textContent = `Score: ${score} | Time: ${time}`;
    move();
  });

  cleanupGame = () => clearInterval(interval);
}

/* 4. MEMORY MATCH */

function gameMemory(area) {
  const symbols = ["🍎","🍋","🍇","🍒","🍉","🥝","🍓","🍍"];
  let cards = [...symbols, ...symbols]
    .sort(() => Math.random() - .5);

  let opened = [];
  let matched = [];
  let moves = 0;
  let locked = false;
  let rewardGiven = false;
  let timeout;

  area.innerHTML = `
    <p class="game-message" id="memoryMessage">Moves: 0</p>
    <div id="memoryBoard" style="
      display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
      gap:8px;max-width:460px;margin:auto"></div>
    <button id="memoryRestart">Restart</button>
  `;

  const board = $("#memoryBoard");
  const message = $("#memoryMessage");

  function draw() {
    board.innerHTML = cards.map((symbol, i) => `
      <button data-card="${i}" style="
        min-height:65px;font-size:25px;border-radius:12px;
        background:${matched.includes(i) ? "#087f5b" : "#173950"};
        color:white">
        ${matched.includes(i) || opened.includes(i) ? symbol : "❔"}
      </button>
    `).join("");
  }

  board.addEventListener("click", event => {
    const button = event.target.closest("[data-card]");
    if (!button || locked) return;

    const i = Number(button.dataset.card);

    if (opened.includes(i) || matched.includes(i)) return;

    opened.push(i);
    draw();

    if (opened.length === 2) {
      moves++;
      locked = true;

      const [a, b] = opened;

      if (cards[a] === cards[b]) {
        matched.push(a, b);
        opened = [];
        locked = false;
        draw();
        message.textContent = `Moves: ${moves}`;

        if (matched.length === cards.length && !rewardGiven) {
          rewardGiven = true;
          message.textContent = "🎉 You matched all cards!";
          finishGame(Math.max(10, 100 - moves));
        }
      } else {
        timeout = setTimeout(() => {
          opened = [];
          locked = false;
          draw();
        }, 700);
      }
    }
  });

  $("#memoryRestart").addEventListener("click", () => gameMemory(area));
  draw();

  cleanupGame = () => clearTimeout(timeout);
}

/* 5. SNAKE */

function gameSnake(area) {
  area.innerHTML = `
    <p class="game-message" id="snakeScore">Score: 0</p>
    <canvas id="snakeCanvas" width="320" height="320"></canvas>
    <div style="text-align:center">
      <button data-dir="up">⬆️</button><br>
      <button data-dir="left">⬅️</button>
      <button data-dir="down">⬇️</button>
      <button data-dir="right">➡️</button>
    </div>
    <p class="game-message">Use the arrows or WASD.</p>
    <button id="snakeStart">Start / Restart</button>
  `;

  const canvas = $("#snakeCanvas");
  const ctx = canvas.getContext("2d");
  const cell = 16;
  let snake, food, dx, dy, score, timer, playing;

  function reset() {
    clearInterval(timer);
    snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    food = {x:5,y:5};
    dx = 1;
    dy = 0;
    score = 0;
    playing = true;
    $("#snakeScore").textContent = "Score: 0";
    draw();

    timer = setInterval(step, 130);
  }

  function draw() {
    ctx.fillStyle = "#071b2b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff5263";
    ctx.fillRect(food.x * cell, food.y * cell, cell - 1, cell - 1);

    ctx.fillStyle = "#20d6a1";
    snake.forEach(part => {
      ctx.fillRect(part.x * cell, part.y * cell, cell - 1, cell - 1);
    });
  }

  function step() {
    if (!playing) return;

    const head = {
      x: snake[0].x + dx,
      y: snake[0].y + dy
    };

    if (head.x < 0 || head.y < 0 ||
        head.x >= 20 || head.y >= 20 ||
        snake.some(part => part.x === head.x && part.y === head.y)) {
      playing = false;
      clearInterval(timer);
      $("#snakeScore").textContent = "Game over! Score: " + score;
      finishGame(score);
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      $("#snakeScore").textContent = "Score: " + score;
      food = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 20)
      };
    } else {
      snake.pop();
    }

    draw();
  }

  function changeDirection(direction) {
    if (direction === "up" && dy !== 1) { dx = 0; dy = -1; }
    if (direction === "down" && dy !== -1) { dx = 0; dy = 1; }
    if (direction === "left" && dx !== 1) { dx = -1; dy = 0; }
    if (direction === "right" && dx !== -1) { dx = 1; dy = 0; }
  }

  area.querySelectorAll("[data-dir]").forEach(button => {
    button.addEventListener("click", () => changeDirection(button.dataset.dir));
  });

  const keyHandler = event => {
    const keys = {
      ArrowUp: "up", w: "up",
      ArrowDown: "down", s: "down",
      ArrowLeft: "left", a: "left",
      ArrowRight: "right", d: "right"
    };

    if (keys[event.key]) {
      event.preventDefault();
      changeDirection(keys[event.key]);
    }
  };

  document.addEventListener("keydown", keyHandler);
  $("#snakeStart").addEventListener("click", reset);

  reset();

  cleanupGame = () => {
    clearInterval(timer);
    document.removeEventListener("keydown", keyHandler);
  };
}

/* 6. GUESS THE NUMBER */

function gameGuess(area) {
  let secret = Math.floor(Math.random() * 100) + 1;
  let attempts = 0;

  area.innerHTML = `
    <p class="game-message">Guess a number from 1 to 100.</p>
    <input id="guessInput" type="number" min="1" max="100"
      placeholder="Enter your guess">
    <button id="guessButton">Guess</button>
    <p id="guessMessage" class="game-message"></p>
    <p id="guessAttempts">Attempts: 0</p>
    <button id="guessRestart">New Number</button>
  `;

  function guess() {
    const value = Number($("#guessInput").value);
    const message = $("#guessMessage");

    if (!value || value < 1 || value > 100) {
      message.textContent = "Enter a number from 1 to 100.";
      return;
    }

    attempts++;
    $("#guessAttempts").textContent = "Attempts: " + attempts;

    if (value === secret) {
      message.textContent = "🎉 Correct! The number was " + secret;
      $("#guessButton").disabled = true;
      finishGame(Math.max(10, 100 - attempts * 5));
    } else if (value < secret) {
      message.textContent = "📈 Too low! Try a bigger number.";
    } else {
      message.textContent = "📉 Too high! Try a smaller number.";
    }

    $("#guessInput").value = "";
    $("#guessInput").focus();
  }

  $("#guessButton").addEventListener("click", guess);

  $("#guessInput").addEventListener("keydown", event => {
    if (event.key === "Enter") guess();
  });

  $("#guessRestart").addEventListener("click", () => gameGuess(area));
}

/* 7. ROCK PAPER SCISSORS */

function gameRPS(area) {
  let score = 0;
  let rounds = 0;

  area.innerHTML = `
    <p class="game-message" id="rpsMessage">Choose your move!</p>
    <div style="display:flex;justify-content:center;flex-wrap:wrap">
      <button data-rps="Rock">✊ Rock</button>
      <button data-rps="Paper">✋ Paper</button>
      <button data-rps="Scissors">✌️ Scissors</button>
    </div>
    <p class="game-message" id="rpsScore">You: 0 | Rounds: 0</p>
  `;

  const icons = { Rock:"✊", Paper:"✋", Scissors:"✌️" };

  area.querySelectorAll("[data-rps]").forEach(button => {
    button.addEventListener("click", () => {
      const user = button.dataset.rps;
      const options = ["Rock", "Paper", "Scissors"];
      const computer = options[Math.floor(Math.random() * 3)];

      let result;

      if (user === computer) {
        result = "Draw!";
      } else if (
        (user === "Rock" && computer === "Scissors") ||
        (user === "Paper" && computer === "Rock") ||
        (user === "Scissors" && computer === "Paper")
      ) {
        result = "You win!";
        score++;
      } else {
        result = "Computer wins!";
      }

      rounds++;

      $("#rpsMessage").textContent =
        `${icons[user]} You vs ${icons[computer]} Computer — ${result}`;

      $("#rpsScore").textContent = `You: ${score} | Rounds: ${rounds}`;

      if (result === "You win!") finishGame(10);
    });
  });
}

/* 8. MATH CHALLENGE */

function gameMath(area) {
  let score = 0;
  let time = 30;
  let currentAnswer = 0;
  let timer = null;
  let playing = false;

  area.innerHTML = `
    <p class="game-message" id="mathInfo">Time: 30 | Score: 0</p>
    <h2 id="mathQuestion" style="text-align:center;margin:25px">
      Press Start!
    </h2>
    <input id="mathAnswer" type="number" placeholder="Your answer">
    <button id="mathSubmit">Submit</button>
    <button id="mathStart">Start</button>
    <p id="mathMessage" class="game-message"></p>
  `;

  function question() {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const operation = Math.random() < .5 ? "+" : "-";

    currentAnswer = operation === "+" ? a + b : a - b;

    $("#mathQuestion").textContent = `${a} ${operation} ${b} = ?`;
    $("#mathAnswer").value = "";
    $("#mathAnswer").focus();
  }

  function end() {
    playing = false;
    clearInterval(timer);
    $("#mathMessage").textContent = "Finished! Score: " + score;
    finishGame(score * 5);
  }

  $("#mathStart").addEventListener("click", () => {
    clearInterval(timer);
    score = 0;
    time = 30;
    playing = true;
    $("#mathMessage").textContent = "";
    $("#mathInfo").textContent = "Time: 30 | Score: 0";
    question();

    timer = setInterval(() => {
      time--;
      $("#mathInfo").textContent = `Time: ${time} | Score: ${score}`;

      if (time <= 0) end();
    }, 1000);
  });

  function submit() {
    if (!playing) return;

    if (Number($("#mathAnswer").value) === currentAnswer) {
      score++;
      $("#mathMessage").textContent = "Correct! 🎉";
    } else {
      $("#mathMessage").textContent = "Not quite. Keep going!";
    }

    $("#mathInfo").textContent = `Time: ${time} | Score: ${score}`;
    question();
  }

  $("#mathSubmit").addEventListener("click", submit);
  $("#mathAnswer").addEventListener("keydown", event => {
    if (event.key === "Enter") submit();
  });

  cleanupGame = () => clearInterval(timer);
}

/* Shared canvas game helpers */

function canvasGame(area, title, setup) {
  area.innerHTML = `
    <p class="game-message" id="canvasScore">${title}</p>
    <canvas id="actionCanvas" width="360" height="420"></canvas>
    <div style="text-align:center">
      <button id="actionLeft">⬅️</button>
      <button id="actionStart">Start / Restart</button>
      <button id="actionRight">➡️</button>
    </div>
    <p class="game-message">Use the buttons or keyboard arrows.</p>
  `;

  const canvas = $("#actionCanvas");
  const ctx = canvas.getContext("2d");

  const game = setup({
    canvas, ctx,
    scoreLabel: $("#canvasScore"),
    leftButton: $("#actionLeft"),
    rightButton: $("#actionRight"),
    startButton: $("#actionStart")
  });

  cleanupGame = () => {
    if (game && game.stop) game.stop();
  };
}

/* 9. DODGE RACER */

function gameRacer(area) {
  canvasGame(area, "Score: 0", ({canvas,ctx,scoreLabel,leftButton,rightButton,startButton}) => {
    let player, obstacles, score, timer, playing, direction;

    function reset() {
      clearInterval(timer);
      player = 155;
      obstacles = [];
      score = 0;
      direction = 0;
      playing = true;
      draw();
      timer = setInterval(step, 35);
    }

    function draw() {
      ctx.fillStyle = "#172d37";
      ctx.fillRect(0,0,360,420);

      ctx.fillStyle = "#536675";
      ctx.fillRect(55,0,250,420);

      ctx.strokeStyle = "#fff";
      ctx.setLineDash([20,20]);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(180,0);
      ctx.lineTo(180,420);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#20d6a1";
      ctx.fillRect(player,340,48,65);

      ctx.fillStyle = "#ff5263";
      obstacles.forEach(o => ctx.fillRect(o.x,o.y,48,60));
    }

    function step() {
      if (!playing) return;

      player += direction * 6;
      player = Math.max(60, Math.min(252, player));

      if (Math.random() < .035) {
        obstacles.push({x:65 + Math.floor(Math.random()*5)*45,y:-60});
      }

      obstacles.forEach(o => o.y += 5);
      obstacles = obstacles.filter(o => o.y < 440);

      const hit = obstacles.some(o =>
        player < o.x + 48 && player + 48 > o.x &&
        340 < o.y + 60 && 405 > o.y
      );

      if (hit) {
        playing = false;
        clearInterval(timer);
        scoreLabel.textContent = "Crash! Score: " + score;
        finishGame(score);
      } else {
        score++;
        scoreLabel.textContent = "Score: " + score;
      }

      draw();
    }

    leftButton.onclick = () => direction = -1;
    rightButton.onclick = () => direction = 1;
    startButton.onclick = reset;

    const key = event => {
      if (event.key === "ArrowLeft") direction = -1;
      if (event.key === "ArrowRight") direction = 1;
    };

    const keyup = () => direction = 0;

    document.addEventListener("keydown",key);
    document.addEventListener("keyup",keyup);
    reset();

    return {stop() {
      clearInterval(timer);
      document.removeEventListener("keydown",key);
      document.removeEventListener("keyup",keyup);
    }};
  });
}

/* 10. FLAPPY BIRD */

function gameFlappy(area) {
  canvasGame(area, "Score: 0", ({canvas,ctx,scoreLabel,startButton}) => {
    let bird, velocity, pipes, score, timer, playing;

    function reset() {
      clearInterval(timer);
      bird = {x:75,y:180};
      velocity = 0;
      pipes = [];
      score = 0;
      playing = true;
      timer = setInterval(step,30);
    }

    function flap() {
      if (playing) velocity = -6;
    }

    function draw() {
      ctx.fillStyle = "#72c8e9";
      ctx.fillRect(0,0,360,420);

      ctx.fillStyle = "#148657";
      pipes.forEach(p => {
        ctx.fillRect(p.x,0,55,p.gap);
        ctx.fillRect(p.x,p.gap+125,55,420);
      });

      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(bird.x,bird.y,13,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "22px Arial";
      ctx.fillText(score,170,35);
    }

    function step() {
      if (!playing) return;

      velocity += .28;
      bird.y += velocity;

      if (Math.random() < .025) {
        pipes.push({x:360,gap:60+Math.random()*180,passed:false});
      }

      pipes.forEach(p => {
        p.x -= 3;

        if (!p.passed && p.x + 55 < bird.x) {
          p.passed = true;
          score++;
        }
      });

      pipes = pipes.filter(p => p.x > -60);

      const hitPipe = pipes.some(p =>
        bird.x + 13 > p.x && bird.x - 13 < p.x + 55 &&
        (bird.y - 13 < p.gap || bird.y + 13 > p.gap + 125)
      );

      if (bird.y < 0 || bird.y > 420 || hitPipe) {
        playing = false;
        clearInterval(timer);
        scoreLabel.textContent = "Game over! Score: " + score;
        finishGame(score * 5);
      }

      draw();
    }

    canvas.addEventListener("pointerdown",flap);
    startButton.onclick = reset;

    const key = event => {
      if (event.code === "Space" && activeGame === "flappy") {
        event.preventDefault();
        flap();
      }
    };

    document.addEventListener("keydown",key);
    reset();

    return {stop() {
      clearInterval(timer);
      canvas.removeEventListener("pointerdown",flap);
      document.removeEventListener("keydown",key);
    }};
  });
}

/* 11. SPACE SHOOTER */

function gameShooter(area) {
  canvasGame(area, "Score: 0", ({canvas,ctx,scoreLabel,leftButton,rightButton,startButton}) => {
    let player, bullets, enemies, score, timer, playing, direction;

    function reset() {
      clearInterval(timer);
      player = 160;
      bullets = [];
      enemies = [];
      score = 0;
      direction = 0;
      playing = true;
      timer = setInterval(step,35);
    }

    function draw() {
      ctx.fillStyle = "#050d24";
      ctx.fillRect(0,0,360,420);

      for (let i=0;i<30;i++) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect((i*79)%360,(i*47)%420,2,2);
      }

      ctx.fillStyle = "#20d6a1";
      ctx.beginPath();
      ctx.moveTo(player+20,350);
      ctx.lineTo(player,390);
      ctx.lineTo(player+40,390);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffe28a";
      bullets.forEach(b => ctx.fillRect(b.x,b.y,5,12));

      ctx.fillStyle = "#ff5263";
      enemies.forEach(e => ctx.fillRect(e.x,e.y,30,25));

      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText("Score: "+score,10,25);
    }

    function step() {
      if (!playing) return;

      player = Math.max(0,Math.min(320,player+direction*5));

      if (Math.random()<.04) {
        enemies.push({x:Math.random()*330,y:-25});
      }

      if (Math.random()<.14) {
        bullets.push({x:player+18,y:345});
      }

      bullets.forEach(b=>b.y-=7);
      enemies.forEach(e=>e.y+=2.4);

      for (let i=enemies.length-1;i>=0;i--) {
        const e=enemies[i];
        const hitIndex=bullets.findIndex(b =>
          b.x>=e.x-5 && b.x<=e.x+30 &&
          b.y>=e.y && b.y<=e.y+25
        );

        if (hitIndex>=0) {
          bullets.splice(hitIndex,1);
          enemies.splice(i,1);
          score+=10;
        } else if (e.y>390) {
          playing=false;
          clearInterval(timer);
          scoreLabel.textContent="Game over! Score: "+score;
          finishGame(score);
          break;
        }
      }

      bullets=bullets.filter(b=>b.y>-20);
      enemies=enemies.filter(e=>e.y<430);
      scoreLabel.textContent="Score: "+score;
      draw();
    }

    leftButton.onclick=()=>direction=-1;
    rightButton.onclick=()=>direction=1;
    startButton.onclick=reset;

    const key=event=>{
      if(event.key==="ArrowLeft") direction=-1;
      if(event.key==="ArrowRight") direction=1;
    };

    const keyup=()=>direction=0;

    document.addEventListener("keydown",key);
    document.addEventListener("keyup",keyup);
    reset();

    return {stop() {
      clearInterval(timer);
      document.removeEventListener("keydown",key);
      document.removeEventListener("keyup",keyup);
    }};
  });
}

/* 12. BRICK BREAKER */

function gameBreakout(area) {
  canvasGame(area, "Score: 0", ({canvas,ctx,scoreLabel,leftButton,rightButton,startButton}) => {
    let ball, paddle, bricks, dx, dy, score, timer, playing, direction;

    function reset() {
      clearInterval(timer);
      ball={x:180,y:300};
      paddle=140;
      dx=3;
      dy=-3;
      score=0;
      direction=0;
      playing=true;
      bricks=[];

      for(let row=0;row<4;row++) {
        for(let col=0;col<7;col++) {
          bricks.push({x:8+col*50,y:35+row*25,alive:true});
        }
      }

      timer=setInterval(step,20);
    }

    function draw() {
      ctx.fillStyle="#071b2b";
      ctx.fillRect(0,0,360,420);

      bricks.forEach((b,i)=>{
        if(!b.alive) return;
        ctx.fillStyle=["#20d6a1","#57b8ff","#ffe28a","#ff7894"][i%4];
        ctx.fillRect(b.x,b.y,43,17);
      });

      ctx.fillStyle="#ffffff";
      ctx.beginPath();
      ctx.arc(ball.x,ball.y,7,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle="#20d6a1";
      ctx.fillRect(paddle,385,80,10);
    }

    function step() {
      if(!playing) return;

      paddle=Math.max(0,Math.min(280,paddle+direction*5));
      ball.x+=dx;
      ball.y+=dy;

      if(ball.x<7 || ball.x>353) dx*=-1;
      if(ball.y<7) dy*=-1;

      if(ball.y>378 && ball.y<398 &&
         ball.x>paddle-5 && ball.x<paddle+85) {
        dy=-Math.abs(dy);
        dx+=(ball.x-(paddle+40))*.04;
      }

      bricks.forEach(b=>{
        if(!b.alive) return;

        if(ball.x>b.x && ball.x<b.x+43 &&
           ball.y>b.y && ball.y<b.y+17) {
          b.alive=false;
          dy*=-1;
          score+=10;
        }
      });

      scoreLabel.textContent="Score: "+score;

      if(ball.y>425) {
        playing=false;
        clearInterval(timer);
        scoreLabel.textContent="Game over! Score: "+score;
        finishGame(score);
      } else if(bricks.every(b=>!b.alive)) {
        playing=false;
        clearInterval(timer);
        scoreLabel.textContent="You win! Score: "+score;
        finishGame(score+20);
      }

      draw();
    }

    leftButton.onclick=()=>direction=-1;
    rightButton.onclick=()=>direction=1;
    startButton.onclick=reset;

    const key=event=>{
      if(event.key==="ArrowLeft") direction=-1;
      if(event.key==="ArrowRight") direction=1;
    };

    const keyup=()=>direction=0;

    document.addEventListener("keydown",key);
    document.addEventListener("keyup",keyup);
    reset();

    return {stop() {
      clearInterval(timer);
      document.removeEventListener("keydown",key);
      document.removeEventListener("keyup",keyup);
    }};
  });
}

/* Fullscreen */

$("#fullscreenBtn").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    toast("Fullscreen is not available in this browser.");
  }
});

/* Export and import saved progress */

$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob(
    [JSON.stringify(state, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "island-game-backup.json";
  link.click();
  URL.revokeObjectURL(url);

  toast("Backup exported!");
});

$("#importBtn").addEventListener("click", () => {
  $("#importFile").click();
});

$("#importFile").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());

    if (typeof imported.coins !== "number" ||
        typeof imported.xp !== "number") {
      throw new Error("Invalid backup");
    }

    state = { ...defaultState, ...imported };
    saveState();
    renderGames();
    toast("Backup imported!");
  } catch {
    toast("Invalid backup file.");
  }

  event.target.value = "";
});

$("#resetBtn").addEventListener("click", () => {
  const confirmed = confirm(
    "Are you sure you want to reset all your progress?"
  );

  if (!confirmed) return;

  state = { ...defaultState };
  saveState();
  renderGames();
  toast("Progress reset.");
});

/* Start */

renderGames();
updateStats();