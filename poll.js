// Gastenpoll — drie vragen, live resultaten op het grote scherm
// Spelers: /poll   Presentator: /poll/host   Export: /poll/export.csv?key=...

const path = require("path");
const crypto = require("crypto");

const QUESTIONS = [
  { key: "q1", type: "text", lead: "Na vandaag wil ik verder aan de slag gaan met…", max: 140 },
  { key: "q2", type: "single", lead: "Ik overweeg om het komende jaar bijkomende vorming te volgen.", options: ["Ja", "Nee", "Misschien"] },
  {
    key: "q3",
    type: "multi",
    lead: "Ik zou graag meer willen leren over deze thema’s:",
    options: [
      "Marketing & promotie",
      "Prijszetting en financieel beheer",
      "Duurzaamheid",
      "Personeel",
      "Wetgeving, reglementering, veiligheid",
      "Operationeel beheer & infrastructuur",
      "Klantbeleving",
      "Andere",
    ],
    other: 7, // index van "Andere": deelnemers vullen zelf een thema in
    otherMax: 80,
  },
];

module.exports = function poll(app, io, HOST_KEY) {
  const nsp = io.of("/poll");
  let state;
  const fresh = () => ({ step: 0, people: new Map(), hidden: new Set(), order: [] });
  state = fresh();
  // step: 0 = wachten, 1-3 = vraag, 4 = overzicht

  app.get("/poll", (_req, res) => res.sendFile(path.join(__dirname, "public", "poll.html")));
  app.get("/poll/host", (_req, res) => res.sendFile(path.join(__dirname, "public", "poll-host.html")));
  app.get("/poll/export.csv", (req, res) => {
    if (req.query.key !== HOST_KEY) return res.status(403).send("Ongeldige sleutel");
    const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const rows = [["deelnemer", QUESTIONS[0].lead, QUESTIONS[1].lead, QUESTIONS[2].lead].map(q).join(";")];
    let n = 0;
    for (const p of state.people.values()) {
      if (p.q1 == null && p.q2 == null && !p.q3.size) continue;
      n++;
      rows.push([
        n,
        p.q1 || "",
        p.q2 == null ? "" : QUESTIONS[1].options[p.q2],
        [...p.q3].sort((a, b) => a - b).map((i) => (i === QUESTIONS[2].other && p.q3other ? "Andere: " + p.q3other : QUESTIONS[2].options[i])).join(", "),
      ].map(q).join(";"));
    }
    res.setHeader("Content-Disposition", 'attachment; filename="gastenpoll.csv"');
    res.type("text/csv; charset=utf-8").send("﻿" + rows.join("\r\n"));
  });

  const people = () => [...state.people.values()];

  function results() {
    const ps = people();
    const single = QUESTIONS[1].options.map(() => 0);
    const multi = QUESTIONS[2].options.map(() => 0);
    ps.forEach((p) => {
      if (p.q2 != null) single[p.q2]++;
      p.q3.forEach((i) => multi[i]++);
    });
    const texts = state.order
      .map((id) => state.people.get(id))
      .filter((p) => p && p.q1)
      .map((p) => ({ id: p.id, text: p.q1, hidden: state.hidden.has(p.id) }));
    return {
      texts,
      single,
      singleN: ps.filter((p) => p.q2 != null).length,
      multi,
      multiN: ps.filter((p) => p.q3.size).length,
      others: ps.filter((p) => p.q3.has(QUESTIONS[2].other) && p.q3other).map((p) => p.q3other),
    };
  }

  function hostView() {
    return {
      step: state.step,
      questions: QUESTIONS,
      online: people().filter((p) => p.sockets.size).length,
      results: results(),
    };
  }

  function personView(p) {
    return { step: state.step, questions: QUESTIONS, mine: { q1: p.q1, q2: p.q2, q3: [...p.q3], q3other: p.q3other } };
  }

  let pending = null;
  function broadcast() {
    // bundel updates: hooguit vier keer per seconde
    if (pending) return;
    pending = setTimeout(() => {
      pending = null;
      nsp.to("hosts").emit("state", hostView());
      for (const p of state.people.values()) {
        const v = personView(p);
        p.sockets.forEach((sid) => nsp.to(sid).emit("pstate", v));
      }
    }, 250);
  }

  const clean = (s, max) =>
    String(s || "")
      .replace(/[\u0000-\u001f\u007f<>]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);

  nsp.on("connection", (socket) => {
    let me = null;
    let isHost = false;

    socket.on("host:auth", (key, cb) => {
      if (key !== HOST_KEY) return cb && cb({ ok: false });
      isHost = true;
      socket.join("hosts");
      cb && cb({ ok: true });
      socket.emit("state", hostView());
    });
    socket.on("host:go", (step) => {
      if (!isHost) return;
      const s = Number(step);
      if (!Number.isInteger(s) || s < 0 || s > 4) return;
      state.step = s;
      broadcast();
    });
    socket.on("host:hide", (id) => {
      if (!isHost) return;
      state.hidden.has(id) ? state.hidden.delete(id) : state.hidden.add(id);
      broadcast();
    });
    socket.on("host:reset", () => {
      if (!isHost) return;
      const old = state.people;
      state = fresh();
      // bestaande gsm's behouden hun verbinding, met lege antwoorden
      for (const p of old.values()) {
        if (!p.sockets.size) continue;
        state.people.set(p.id, { id: p.id, q1: null, q2: null, q3: new Set(), q3other: null, sockets: p.sockets });
      }
      broadcast();
    });

    socket.on("join", (id, cb) => {
      let p = typeof id === "string" && state.people.get(id);
      if (!p) {
        const nid = crypto.randomBytes(8).toString("hex");
        p = { id: nid, q1: null, q2: null, q3: new Set(), q3other: null, sockets: new Set() };
        state.people.set(nid, p);
      }
      me = p;
      p.sockets.add(socket.id);
      cb && cb({ id: p.id });
      socket.emit("pstate", personView(p));
      broadcast();
    });

    socket.on("answer", (msg) => {
      if (!me || !state.people.has(me.id) || !msg) return;
      // zodra de poll gestart is, beantwoordt iedereen de vragen in zijn eigen tempo
      if (state.step < 1 || !QUESTIONS.some((q) => q.key === msg.q)) return;
      if (msg.q === "q1") {
        const t = clean(msg.value, QUESTIONS[0].max);
        if (!t) return;
        if (!me.q1) state.order.push(me.id);
        me.q1 = t;
        state.hidden.delete(me.id);
      } else if (msg.q === "q2") {
        const i = Number(msg.value);
        if (!Number.isInteger(i) || i < 0 || i >= QUESTIONS[1].options.length) return;
        me.q2 = i;
      } else if (msg.q === "q3") {
        if (!Array.isArray(msg.value)) return;
        const n = QUESTIONS[2].options.length;
        me.q3 = new Set(msg.value.map(Number).filter((i) => Number.isInteger(i) && i >= 0 && i < n));
        if (typeof msg.other === "string") me.q3other = clean(msg.other, QUESTIONS[2].otherMax) || null;
      }
      broadcast();
    });

    socket.on("disconnect", () => {
      if (me) {
        me.sockets.delete(socket.id);
        broadcast();
      }
    });
  });
};
