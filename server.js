// De Slimste Gast — live quizserver
// Start: npm install && npm start  →  host op /host, spelers op /

const path = require("path");
const http = require("http");
const crypto = require("crypto");
const express = require("express");
const { Server } = require("socket.io");
const QRCode = require("qrcode");
const { questions, tiebreak } = require("./questions");

const PORT = process.env.PORT || 3000;
const HOST_KEY = process.env.HOST_KEY || "limburg";
const QUESTION_SECONDS = Number(process.env.QUESTION_SECONDS || 20);
const TIEBREAK_SECONDS = Number(process.env.TIEBREAK_SECONDS || 30);
const POINTS = 100;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 20000 });

app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.get("/host", (_req, res) => res.sendFile(path.join(__dirname, "public", "host.html")));
app.get("/health", (_req, res) => res.send("ok"));

// ---------- state ----------
let state;
function freshState() {
  return {
    phase: "lobby", // lobby | question | reveal | leaderboard | tiebreak | tiebreakReveal | final
    qIndex: -1,
    deadline: 0,
    players: new Map(), // id -> {id, name, score, answers:{[q]:{choice,correct}}, guess, sockets:Set}
  };
}
state = freshState();
let timer = null;

const publicUrl = (req) =>
  process.env.PUBLIC_URL ||
  `${(req.headers["x-forwarded-proto"] || "http").split(",")[0]}://${req.headers["x-forwarded-host"] || req.headers.host}`;

app.get("/qr.svg", async (req, res) => {
  const url = req.query.u || publicUrl(req) + "/";
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#1d3736", light: "#ffffff" } });
  res.type("image/svg+xml").send(svg);
});

// ---------- helpers ----------
const playersArr = () => [...state.players.values()];

function ranking() {
  const t = tiebreak.answer;
  const decided = state.phase === "tiebreakReveal" || state.phase === "final";
  return playersArr()
    .slice()
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const da = a.guess == null ? Infinity : Math.abs(a.guess - t);
      const db = b.guess == null ? Infinity : Math.abs(b.guess - t);
      if (da !== db) return da - db;
      return a.name.localeCompare(b.name, "nl");
    })
    .map((p, i, all) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      guess: p.guess,
      // tijdens de quiz delen gelijke scores een plaats; na de schiftingsvraag is de volgorde definitief
      rank: decided ? i + 1 : 1 + all.filter((o) => o.score > p.score).length,
      online: p.sockets.size > 0,
    }));
}

function currentQuestion() {
  return questions[state.qIndex];
}

function answeredCount() {
  if (state.phase === "tiebreak") return playersArr().filter((p) => p.guess != null).length;
  return playersArr().filter((p) => p.answers[state.qIndex]).length;
}

function distribution() {
  const q = currentQuestion();
  if (!q) return [];
  const d = q.options.map(() => 0);
  playersArr().forEach((p) => {
    const a = p.answers[state.qIndex];
    if (a) d[a.choice]++;
  });
  return d;
}

function remaining() {
  return Math.max(0, state.deadline - Date.now());
}

function hostView() {
  const q = currentQuestion();
  const v = {
    phase: state.phase,
    qIndex: state.qIndex,
    total: questions.length,
    remaining: remaining(),
    duration: (state.phase === "tiebreak" ? TIEBREAK_SECONDS : QUESTION_SECONDS) * 1000,
    players: playersArr().map((p) => ({ id: p.id, name: p.name, online: p.sockets.size > 0 })),
    answered: answeredCount(),
    ranking: ranking(),
  };
  if (q && (state.phase === "question" || state.phase === "reveal")) {
    v.question = { type: q.type, text: q.text, options: q.options };
    if (state.phase === "reveal") {
      v.question.correct = q.correct;
      v.question.fact = q.fact;
      v.distribution = distribution();
    }
  }
  if (state.phase === "tiebreak" || state.phase === "tiebreakReveal") {
    v.tiebreak = { text: tiebreak.text, unit: tiebreak.unit };
    if (state.phase === "tiebreakReveal") {
      v.tiebreak.answer = tiebreak.answer;
      v.tiebreak.fact = tiebreak.fact;
      v.closest = playersArr()
        .filter((p) => p.guess != null)
        .map((p) => ({ name: p.name, guess: p.guess, diff: Math.abs(p.guess - tiebreak.answer) }))
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 6);
    }
  }
  return v;
}

function playerView(p) {
  const q = currentQuestion();
  const rk = ranking();
  const me = rk.find((r) => r.id === p.id);
  const v = {
    phase: state.phase,
    qIndex: state.qIndex,
    total: questions.length,
    remaining: remaining(),
    duration: (state.phase === "tiebreak" ? TIEBREAK_SECONDS : QUESTION_SECONDS) * 1000,
    name: p.name,
    score: p.score,
    rank: me ? me.rank : null,
    players: rk.length,
  };
  if (q && (state.phase === "question" || state.phase === "reveal")) {
    v.question = { type: q.type, text: q.text, options: q.options };
    const a = p.answers[state.qIndex];
    v.myChoice = a ? a.choice : null;
    if (state.phase === "reveal") {
      v.question.correct = q.correct;
      v.question.fact = q.fact;
      v.wasCorrect = a ? a.correct : false;
    }
  }
  if (state.phase === "tiebreak" || state.phase === "tiebreakReveal") {
    v.tiebreak = { text: tiebreak.text, unit: tiebreak.unit };
    v.myGuess = p.guess;
    if (state.phase === "tiebreakReveal") v.tiebreak.answer = tiebreak.answer;
  }
  return v;
}

function broadcast() {
  io.to("hosts").emit("state", hostView());
  for (const p of state.players.values()) {
    const view = playerView(p);
    p.sockets.forEach((sid) => io.to(sid).emit("pstate", view));
  }
}

function clearTimer() {
  if (timer) clearTimeout(timer);
  timer = null;
}

function startQuestion(i) {
  clearTimer();
  state.qIndex = i;
  state.phase = "question";
  state.deadline = Date.now() + QUESTION_SECONDS * 1000;
  timer = setTimeout(reveal, QUESTION_SECONDS * 1000 + 300);
  broadcast();
}

function reveal() {
  if (state.phase !== "question") return;
  clearTimer();
  state.phase = "reveal";
  state.deadline = 0;
  broadcast();
}

function startTiebreak() {
  clearTimer();
  state.phase = "tiebreak";
  state.deadline = Date.now() + TIEBREAK_SECONDS * 1000;
  timer = setTimeout(revealTiebreak, TIEBREAK_SECONDS * 1000 + 300);
  broadcast();
}

function revealTiebreak() {
  if (state.phase !== "tiebreak") return;
  clearTimer();
  state.phase = "tiebreakReveal";
  state.deadline = 0;
  broadcast();
}

function next() {
  switch (state.phase) {
    case "lobby":
      return startQuestion(0);
    case "question":
      return reveal();
    case "reveal":
      state.phase = "leaderboard";
      return broadcast();
    case "leaderboard":
      if (state.qIndex < questions.length - 1) return startQuestion(state.qIndex + 1);
      return startTiebreak();
    case "tiebreak":
      return revealTiebreak();
    case "tiebreakReveal":
      state.phase = "final";
      return broadcast();
    default:
      return;
  }
}

function maybeAutoClose() {
  const n = state.players.size;
  if (n > 0 && answeredCount() >= n) {
    // iedereen heeft geantwoord: korte pauze en dan door
    clearTimer();
    timer = setTimeout(state.phase === "tiebreak" ? revealTiebreak : reveal, 1200);
  }
}

const cleanName = (s) =>
  String(s || "")
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);

// ---------- sockets ----------
io.on("connection", (socket) => {
  let player = null;
  let isHost = false;

  socket.on("host:auth", (key, cb) => {
    if (key !== HOST_KEY) return cb && cb({ ok: false });
    isHost = true;
    socket.join("hosts");
    cb && cb({ ok: true });
    socket.emit("state", hostView());
  });

  socket.on("host:next", () => isHost && next());
  socket.on("host:reset", () => {
    if (!isHost) return;
    clearTimer();
    const old = state.players;
    state = freshState();
    // spelers blijven verbonden maar moeten hun naam opnieuw ingeven
    for (const p of old.values()) p.sockets.forEach((sid) => io.to(sid).emit("reset"));
    broadcast();
  });
  socket.on("host:kick", (id) => {
    if (!isHost) return;
    const p = state.players.get(id);
    if (!p) return;
    p.sockets.forEach((sid) => io.to(sid).emit("reset"));
    state.players.delete(id);
    broadcast();
  });

  socket.on("player:resume", (id, cb) => {
    const p = state.players.get(id);
    if (!p) return cb && cb({ ok: false });
    player = p;
    p.sockets.add(socket.id);
    cb && cb({ ok: true, name: p.name });
    broadcast();
  });

  socket.on("player:join", (rawName, cb) => {
    const name = cleanName(rawName);
    if (!name) return cb && cb({ ok: false, error: "Geef een naam in." });
    const taken = playersArr().some((p) => p.name.toLowerCase() === name.toLowerCase());
    if (taken) return cb && cb({ ok: false, error: "Die naam is al bezet. Kies een andere." });
    if (state.players.size >= 300) return cb && cb({ ok: false, error: "De quiz zit vol." });
    const id = crypto.randomBytes(8).toString("hex");
    player = { id, name, score: 0, answers: {}, guess: null, sockets: new Set([socket.id]) };
    state.players.set(id, player);
    cb && cb({ ok: true, id, name });
    broadcast();
  });

  socket.on("player:answer", (choice) => {
    if (!player || !state.players.has(player.id)) return;
    if (state.phase !== "question" || remaining() <= 0) return;
    const q = currentQuestion();
    if (player.answers[state.qIndex]) return; // eerste antwoord telt
    const c = Number(choice);
    if (!Number.isInteger(c) || c < 0 || c >= q.options.length) return;
    const correct = c === q.correct;
    player.answers[state.qIndex] = { choice: c, correct };
    if (correct) player.score += POINTS;
    broadcast();
    maybeAutoClose();
  });

  socket.on("player:guess", (value) => {
    if (!player || !state.players.has(player.id)) return;
    if (state.phase !== "tiebreak" || remaining() <= 0) return;
    if (player.guess != null) return;
    const n = Number(String(value).replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100000) return;
    player.guess = Math.round(n * 100) / 100;
    broadcast();
    maybeAutoClose();
  });

  socket.on("disconnect", () => {
    if (player) {
      player.sockets.delete(socket.id);
      broadcast();
    }
  });
});

server.listen(PORT, () => {
  console.log(`De Slimste Gast draait op poort ${PORT}`);
  console.log(`Host: /host  (sleutel: ${HOST_KEY === "limburg" ? "limburg — wijzig via HOST_KEY" : "ingesteld via HOST_KEY"})`);
});
