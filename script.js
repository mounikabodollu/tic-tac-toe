const board = ["", "", "", "", "", "", "", "", ""];
const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

const gameSelection = document.querySelector("#game-selection");
const playerSetup = document.querySelector("#player-setup");
const gameContainer = document.querySelector("#game-container");
const resultScreen = document.querySelector("#result-screen");
const setupTitle = document.querySelector("#setup-title");
const nameFields = document.querySelector("#player-name-fields");
const setupForm = document.querySelector("#setup-form");
const validationMessage = document.querySelector("#validation-message");
const cells = Array.from(document.querySelectorAll(".cell"));
const modeLabel = document.querySelector("#mode-label");
const playerMatchup = document.querySelector("#player-matchup");
const turnSymbol = document.querySelector("#turn-symbol");
const statusLabel = document.querySelector("#status-label");
const statusMessage = document.querySelector("#status-message");
const statusPanel = document.querySelector(".status-panel");
const resultEmoji = document.querySelector("#result-emoji");
const resultKicker = document.querySelector("#result-kicker");
const resultTitle = document.querySelector("#result-title");
const resultMessage = document.querySelector("#result-message");
const resultBoard = document.querySelector("#result-board");
const confetti = document.querySelector("#confetti");

let gameMode = "";
let player1Name = "";
let player2Name = "";
let currentPlayer = "X";
let gameActive = false;
let winner = "";
let winningCells = [];
let computerThinking = false;
let computerTimer = null;

document.querySelectorAll(".mode-button").forEach((button) => {
  button.addEventListener("click", () => selectGameMode(button.dataset.mode));
});

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
setupForm.addEventListener("submit", startGame);
document.querySelector("#back-to-selection").addEventListener("click", showGameSelection);
document.querySelector("#change-mode").addEventListener("click", changeGameMode);
document.querySelector("#result-change-mode").addEventListener("click", changeGameMode);
document.querySelector("#play-again").addEventListener("click", playAgain);
document.querySelector("#restart-game").addEventListener("click", restartGame);

function showGameSelection() {
  clearComputerTimer();
  resetGame();
  player1Name = "";
  player2Name = "";
  gameMode = "";
  playerMatchup.replaceChildren();
  resultBoard.replaceChildren();
  confetti.replaceChildren();
  resultEmoji.textContent = "";
  resultKicker.textContent = "";
  resultTitle.textContent = "";
  resultMessage.textContent = "";
  validationMessage.textContent = "";
  validationMessage.hidden = true;
  gameSelection.hidden = false;
  playerSetup.hidden = true;
  gameContainer.hidden = true;
  resultScreen.hidden = true;
}

function selectGameMode(mode) {
  if (mode !== "pvp" && mode !== "computer") {
    return;
  }

  gameMode = mode;
  player1Name = "";
  player2Name = "";
  setupTitle.textContent = mode === "pvp" ? "👥 Player vs Player" : "🤖 Player vs Computer";
  validationMessage.hidden = true;
  validationMessage.textContent = "";
  nameFields.replaceChildren();

  addNameField(
    "player1-name",
    mode === "pvp" ? "Player 1 Name" : "Your Name",
    mode === "pvp" ? "Enter Player 1 Name" : "Enter Your Name"
  );

  if (mode === "pvp") {
    addNameField("player2-name", "Player 2 Name", "Enter Player 2 Name");
  } else {
    const marks = document.createElement("p");
    marks.className = "setup-marks";
    marks.textContent = "You → X     ·     Computer → O";
    nameFields.append(marks);
  }

  gameSelection.hidden = true;
  playerSetup.hidden = false;
  gameContainer.hidden = true;
  resultScreen.hidden = true;
  nameFields.querySelector("input").focus();
}

function addNameField(id, labelText, placeholder) {
  const wrapper = document.createElement("div");
  wrapper.className = "name-field";

  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = labelText;

  const input = document.createElement("input");
  input.id = id;
  input.name = id;
  input.type = "text";
  input.placeholder = placeholder;
  input.autocomplete = "name";
  input.maxLength = 24;
  input.required = true;

  wrapper.append(label, input);
  nameFields.append(wrapper);
}

function startGame(event) {
  event.preventDefault();
  const firstName = nameFields.querySelector("#player1-name").value.trim();
  const secondInput = nameFields.querySelector("#player2-name");
  const secondName = secondInput ? secondInput.value.trim() : "Computer";

  if (!firstName || (gameMode === "pvp" && !secondName)) {
    validationMessage.textContent = gameMode === "pvp"
      ? "Please enter both player names."
      : "Please enter your name.";
    validationMessage.hidden = false;
    return;
  }

  player1Name = firstName;
  player2Name = secondName;
  gameSelection.hidden = true;
  playerSetup.hidden = true;
  resultScreen.hidden = true;
  gameContainer.hidden = false;
  modeLabel.textContent = gameMode === "computer" ? "PLAYER VS COMPUTER" : "PLAYER VS PLAYER";
  updateMatchup();
  restartGame();
}

function handleCellClick(event) {
  const cellIndex = Number(event.currentTarget.dataset.index);
  if (!gameActive || computerThinking || board[cellIndex] !== "") {
    return;
  }

  makeMove(cellIndex, currentPlayer);

  if (gameActive && gameMode === "computer" && currentPlayer === "O") {
    computerThinking = true;
    updateTurnDisplay();
    computerTimer = window.setTimeout(() => {
      computerThinking = false;
      computerMove();
    }, 380);
  }
}

function makeMove(cellIndex, player) {
  if (!gameActive || !Number.isInteger(cellIndex) || board[cellIndex] !== "") {
    return;
  }

  board[cellIndex] = player;
  updateBoard();

  const result = checkWinner();
  if (result) {
    gameActive = false;
    winner = result.player;
    winningCells = result.combination;
    winningCells.forEach((index) => cells[index].classList.add("is-winning"));
    showWinnerScreen();
    return;
  }

  if (checkDraw()) {
    gameActive = false;
    winner = "";
    winningCells = [];
    showDrawScreen();
    return;
  }

  currentPlayer = player === "X" ? "O" : "X";
  updateTurnDisplay();
}

function updateBoard() {
  cells.forEach((cell, index) => {
    const mark = board[index];
    cell.textContent = mark;
    cell.classList.toggle("mark-x", mark === "X");
    cell.classList.toggle("mark-o", mark === "O");
    cell.classList.toggle("is-winning", winningCells.includes(index));
    cell.disabled = mark !== "" || !gameActive || computerThinking;

    const row = Math.floor(index / 3) + 1;
    const column = (index % 3) + 1;
    cell.setAttribute("aria-label", `Row ${row}, column ${column}${mark ? `, ${mark}` : ", empty"}`);
  });
}

function updateMatchup() {
  playerMatchup.replaceChildren();
  const first = document.createElement("span");
  first.className = "matchup-player";
  first.textContent = `${player1Name} (X)`;
  const versus = document.createElement("span");
  versus.className = "matchup-versus";
  versus.textContent = "vs";
  const second = document.createElement("span");
  second.className = "matchup-player";
  second.textContent = `${player2Name} (O)`;
  playerMatchup.append(first, versus, second);
}

function updateTurnDisplay() {
  const activeName = currentPlayer === "X" ? player1Name : player2Name;
  turnSymbol.textContent = currentPlayer;
  turnSymbol.classList.toggle("symbol-o", currentPlayer === "O");
  statusPanel.classList.remove("is-finished");

  if (computerThinking) {
    statusLabel.textContent = "COMPUTER'S TURN";
    statusMessage.textContent = "🤖 Computer's Turn";
  } else {
    statusLabel.textContent = `${activeName.toLocaleUpperCase()}'S TURN`;
    statusMessage.textContent = gameMode === "computer" && currentPlayer === "O"
      ? "🤖 Computer's Turn"
      : `✨ ${activeName}'s Turn`;
  }

  updateBoard();
}

function checkWinner() {
  for (const combination of winningCombinations) {
    const [first, second, third] = combination;
    if (board[first] && board[first] === board[second] && board[first] === board[third]) {
      return { player: board[first], combination };
    }
  }

  return null;
}

function checkDraw() {
  return board.every((cell) => cell !== "") && checkWinner() === null;
}

function computerMove() {
  if (!gameActive || gameMode !== "computer" || currentPlayer !== "O") {
    updateBoard();
    return;
  }

  const move = findWinningMove("O")
    ?? findWinningMove("X")
    ?? (board[4] === "" ? 4 : null)
    ?? chooseAvailableCorner()
    ?? board.findIndex((cell) => cell === "");

  if (move !== -1 && move !== null) {
    makeMove(move, "O");
  }
}

function findWinningMove(player) {
  for (const combination of winningCombinations) {
    const emptyCells = combination.filter((index) => board[index] === "");
    const playerCells = combination.filter((index) => board[index] === player);
    if (emptyCells.length === 1 && playerCells.length === 2) {
      return emptyCells[0];
    }
  }

  return null;
}

function chooseAvailableCorner() {
  const availableCorners = [0, 2, 6, 8].filter((index) => board[index] === "");
  return availableCorners.length
    ? availableCorners[Math.floor(Math.random() * availableCorners.length)]
    : null;
}

function showWinnerScreen() {
  const winnerName = winner === "X" ? player1Name : player2Name;
  const isComputerWinner = gameMode === "computer" && winner === "O";
  resultEmoji.textContent = isComputerWinner ? "🤖🏆" : "🎉🎉🎉";
  resultKicker.textContent = isComputerWinner ? "GAME OVER!" : "CONGRATULATIONS!";
  resultTitle.textContent = `🏆 ${winnerName} Wins!`;
  resultMessage.textContent = isComputerWinner
    ? "Better luck next time! 😄"
    : "What an amazing game! 🎊 You played brilliantly!";
  confetti.hidden = isComputerWinner;
  if (!isComputerWinner) {
    createConfetti();
  }
  renderResultBoard();
  showResult();
}

function showDrawScreen() {
  resultEmoji.textContent = "🤝";
  resultKicker.textContent = "IT'S A DRAW!";
  resultTitle.textContent = "What a close match! 😮";
  resultMessage.textContent = "Both players played amazingly! Nobody gave up! 😄";
  confetti.hidden = true;
  renderResultBoard();
  showResult();
}

function renderResultBoard() {
  resultBoard.replaceChildren();
  board.forEach((mark, index) => {
    const resultCell = document.createElement("span");
    resultCell.className = "result-cell";
    if (mark) {
      resultCell.classList.add(mark === "X" ? "mark-x" : "mark-o");
    }
    if (winningCells.includes(index)) {
      resultCell.classList.add("is-winning");
    }
    resultCell.textContent = mark;
    resultBoard.append(resultCell);
  });
}

function createConfetti() {
  const pieces = Array.from({ length: 28 }, (_, index) => {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--left", `${(index * 37) % 100}%`);
    piece.style.setProperty("--hue", `${(index * 47) % 360}deg`);
    piece.style.setProperty("--delay", `${(index % 7) * 55}ms`);
    piece.style.setProperty("--rotation", `${(index * 53) % 360}deg`);
    return piece;
  });
  confetti.replaceChildren(...pieces);
}

function showResult() {
  gameContainer.hidden = true;
  resultScreen.hidden = false;
  resultTitle.focus?.();
}

function restartGame() {
  clearComputerTimer();
  resetGame();
  gameActive = true;
  updateTurnDisplay();
}

function playAgain() {
  resultScreen.hidden = true;
  gameContainer.hidden = false;
  restartGame();
}

function changeGameMode() {
  showGameSelection();
}

function resetGame() {
  clearComputerTimer();
  board.fill("");
  currentPlayer = "X";
  gameActive = false;
  winner = "";
  winningCells = [];
  computerThinking = false;
  statusPanel.classList.remove("is-finished");
  cells.forEach((cell) => cell.classList.remove("mark-x", "mark-o", "is-winning"));
  updateBoard();
}

function clearComputerTimer() {
  window.clearTimeout(computerTimer);
  computerTimer = null;
}
