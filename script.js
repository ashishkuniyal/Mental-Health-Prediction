(() => {
  "use strict";

  const API_BASE = "";

  // ── DOM ELEMENTS ──────────────────────────────────────
  const form = document.getElementById("predict-form");
  const wizardShell = document.getElementById("wizard-shell");
  const resultScreen = document.getElementById("result-screen");
  const themeToggle = document.getElementById("theme-toggle");

  // Steps
  const stepPanels = [
    document.getElementById("step-1"),
    document.getElementById("step-2"),
    document.getElementById("step-3")
  ];
  const stepItems = document.querySelectorAll(".step-item");
  const stepLine = document.querySelector(".step-line");

  let currentStep = 1;

  // Buttons
  const next1 = document.getElementById("next-1");
  const next2 = document.getElementById("next-2");
  const back2 = document.getElementById("back-2");
  const back3 = document.getElementById("back-3");
  const submitBtn = document.getElementById("submit-btn");
  const redoBtn = document.getElementById("redo-btn");
  const shareBtn = document.getElementById("share-btn");
  const errRetryBtn = document.getElementById("err-retry-btn");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  // Result UI
  const rsLoading = document.getElementById("rs-loading");
  const rsResult = document.getElementById("rs-result");
  const rsError = document.getElementById("rs-error");
  const rsScoreNum = document.getElementById("rs-score-num");
  const rsEmoji = document.getElementById("rs-emoji");
  const rsBand = document.getElementById("rs-band");
  const rsCtx = document.getElementById("rs-ctx");
  const rgFill = document.getElementById("rg-fill");
  const rgNeedle = document.getElementById("rg-needle");
  const tipsList = document.getElementById("tips-list");
  const breakdownList = document.getElementById("breakdown-list");
  const historyRow = document.getElementById("history-row");
  const errBody = document.getElementById("err-body");

  // ── THEME TOGGLE ──────────────────────────────────────
  const storedTheme = localStorage.getItem("mm-theme") || "dark";
  document.documentElement.setAttribute("data-theme", storedTheme);

  themeToggle.addEventListener("click", () => {
    const curr = document.documentElement.getAttribute("data-theme");
    const next = curr === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("mm-theme", next);
  });

  // ── DRAW TICKS ────────────────────────────────────────
  const rgTicks = document.getElementById("rg-ticks");
  if (rgTicks) {
    const cx = 140, cy = 150, rOut = 110, rIn = 100;
    for (let i = 0; i <= 10; i += 2) {
      const angle = Math.PI - (i / 10) * Math.PI;
      const x1 = cx + rOut * Math.cos(angle);
      const y1 = cy - rOut * Math.sin(angle);
      const x2 = cx + rIn * Math.cos(angle);
      const y2 = cy - rIn * Math.sin(angle);
      const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ln.setAttribute("x1", x1.toFixed(1)); ln.setAttribute("y1", y1.toFixed(1));
      ln.setAttribute("x2", x2.toFixed(1)); ln.setAttribute("y2", y2.toFixed(1));
      ln.setAttribute("stroke", "rgba(232, 160, 69, 0.3)");
      ln.setAttribute("stroke-width", "2");
      ln.setAttribute("stroke-linecap", "round");
      rgTicks.appendChild(ln);
    }
  }

  // ── WIZARD LOGIC ──────────────────────────────────────
  function goToStep(step) {
    // Hide all
    stepPanels.forEach(p => p.classList.remove("active"));
    stepItems.forEach(i => {
      i.classList.remove("active", "completed");
      const s = parseInt(i.dataset.step);
      if (s < step) i.classList.add("completed");
      else if (s === step) i.classList.add("active");
    });

    // Show current
    stepPanels[step - 1].classList.add("active");
    currentStep = step;

    // Update line progress
    if (stepLine) {
      const pct = step === 1 ? "0%" : step === 2 ? "50%" : "100%";
      stepLine.style.setProperty("--progress", pct);
    }
  }

  next1.addEventListener("click", () => {
    if (validateStep(1)) goToStep(2);
  });
  next2.addEventListener("click", () => {
    if (validateStep(2)) goToStep(3);
  });
  back2.addEventListener("click", () => goToStep(1));
  back3.addEventListener("click", () => goToStep(2));

  // ── STRESS CARDS ──────────────────────────────────────
  const stressCards = document.querySelectorAll(".stress-card");
  const stressHidden = document.getElementById("stress_level");
  stressCards.forEach(card => {
    card.addEventListener("click", () => {
      stressCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      stressHidden.value = card.dataset.value;
      clearFieldError(stressHidden);
    });
  });

  // ── USAGE SCALE VISUAL ────────────────────────────────
  const usageInput = document.getElementById("avg_daily_usage_hours");
  const usageFill = document.getElementById("usage-fill");
  usageInput.addEventListener("input", () => {
    let val = parseFloat(usageInput.value) || 0;
    let pct = Math.min((val / 12) * 100, 100);
    usageFill.style.width = pct + "%";
  });

  // ── VALIDATION ────────────────────────────────────────
  function fieldWrapper(input) {
    if (input.id === "stress_level") return input.closest(".stress-section");
    return input.closest(".field");
  }
  function setFieldError(input, msg) {
    const w = fieldWrapper(input);
    if (!w) return;
    w.classList.add("has-error");
    const m = w.querySelector(".error-msg");
    if (m) m.textContent = msg;
  }
  function clearFieldError(input) {
    const w = fieldWrapper(input);
    if (!w) return;
    w.classList.remove("has-error");
    const m = w.querySelector(".error-msg");
    if (m) m.textContent = "";
  }
  
  form.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("input", () => clearFieldError(el));
    el.addEventListener("change", () => clearFieldError(el));
  });

  function validateStep(step) {
    let valid = true;
    let fields = [];
    if (step === 1) fields = ["age", "gender", "country", "academic_level"];
    if (step === 2) fields = ["most_used_platform", "purpose_of_use", "avg_daily_usage_hours", "daily_unlocks"];
    if (step === 3) fields = ["study_hours", "physical_activity_hours", "sleep_hours_per_night", "stress_level"];

    fields.forEach(id => {
      const el = document.getElementById(id);
      const val = el.value.trim();
      if (!val) {
        setFieldError(el, "Required");
        valid = false;
      } else {
        if (el.type === "number") {
          const num = parseFloat(val);
          const min = parseFloat(el.min);
          const max = parseFloat(el.max);
          if (!isNaN(min) && num < min) { setFieldError(el, `Min ${min}`); valid = false; }
          if (!isNaN(max) && num > max) { setFieldError(el, `Max ${max}`); valid = false; }
        }
      }
    });
    return valid;
  }

  function collectPayload() {
    const fd = new FormData(form);
    return {
      age: parseInt(fd.get("age")),
      gender: fd.get("gender"),
      country: fd.get("country").trim(),
      academic_level: fd.get("academic_level"),
      most_used_platform: fd.get("most_used_platform"),
      purpose_of_use: fd.get("purpose_of_use"),
      avg_daily_usage_hours: parseFloat(fd.get("avg_daily_usage_hours")),
      daily_unlocks: parseInt(fd.get("daily_unlocks")),
      study_hours: parseFloat(fd.get("study_hours")),
      physical_activity_hours: parseFloat(fd.get("physical_activity_hours")),
      sleep_hours_per_night: parseFloat(fd.get("sleep_hours_per_night")),
      stress_level: fd.get("stress_level"),
    };
  }

  // ── SUBMISSION ────────────────────────────────────────
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validateStep(3)) return;

    const payload = collectPayload();
    
    wizardShell.hidden = true;
    resultScreen.hidden = false;
    rsLoading.hidden = false;
    rsResult.hidden = true;
    rsError.hidden = true;

    try {
      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem("mm-token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `API error ${res.status}`);
      }

      const data = await res.json();
      renderResult(data.predicted_mental_health_score, payload, data.streak_count);
    } catch (err) {
      rsLoading.hidden = true;
      rsError.hidden = false;
      errBody.textContent = err.message || "Could not connect to the server.";
    }
  });

  // ── RESULT RENDERING ──────────────────────────────────
  function bandFor(score) {
    if (score < 4) return { label: "Strained", emoji: "😟", ctx: "Your habits show signs of strain. Small changes can help.", cls: "bad" };
    if (score < 6) return { label: "Moderate", emoji: "😐", ctx: "You're in a middling zone. Room for improvement.", cls: "ok" };
    if (score < 8) return { label: "Balanced", emoji: "😊", ctx: "Fairly healthy rhythm. Keep it up.", cls: "ok" };
    return { label: "Strong", emoji: "🌟", ctx: "Excellent mental wellness balance!", cls: "good" };
  }

  function renderResult(score, payload, streak = 0) {
    if (streak > 0) {
       let streakEl = document.getElementById("nav-streak");
       if (streakEl) streakEl.innerHTML = `🔥 ${streak} Day Streak!`;
    }

    const clamped = Math.max(0, Math.min(10, score));
    const band = bandFor(clamped);

    rsScoreNum.textContent = score.toFixed(2);
    rsEmoji.textContent = band.emoji;
    rsBand.textContent = band.label;
    rsCtx.textContent = band.ctx;

    rsLoading.hidden = true;
    rsResult.hidden = false;

    // Animate gauge (345 is total length)
    setTimeout(() => {
      rgFill.style.strokeDashoffset = String(345 * (1 - clamped / 10));
      const deg = -90 + (clamped / 10) * 180;
      rgNeedle.style.transform = `rotate(${deg}deg)`;
    }, 100);

    renderTips(payload);
    renderBreakdown(payload);
    saveHistory(score, band);
    
    if (clamped >= 8) launchConfetti();
    
    resultScreen.scrollIntoView({ behavior: 'smooth' });
  }

  function renderTips(payload) {
    const tips = [];
    if (payload.sleep_hours_per_night < 6) tips.push({ icon: "😴", title: "Sleep Deficit", text: "Try to add an hour of sleep." });
    else if (payload.sleep_hours_per_night >= 7) tips.push({ icon: "✅", title: "Great Sleep", text: "You're getting optimal rest." });

    if (payload.avg_daily_usage_hours > 5) tips.push({ icon: "📱", title: "High Screen Time", text: "Consider setting app limits." });
    
    if (payload.physical_activity_hours < 0.5) tips.push({ icon: "🏃", title: "Low Activity", text: "Even a 20-min walk helps." });
    
    if (payload.stress_level === "Very High") tips.push({ icon: "🧘", title: "High Stress", text: "Try mindfulness or taking a break." });

    tipsList.innerHTML = tips.map(t => `
      <li class="tip-item">
        <div class="tip-icon">${t.icon}</div>
        <div class="tip-text"><strong>${t.title}</strong>${t.text}</div>
      </li>
    `).join("");
  }

  function renderBreakdown(payload) {
    const items = [
      { lbl: "Sleep", val: payload.sleep_hours_per_night, max: 10, pct: Math.min(payload.sleep_hours_per_night/9*100, 100), goodFn: v=>v>=7 },
      { lbl: "Activity", val: payload.physical_activity_hours, max: 4, pct: Math.min(payload.physical_activity_hours/2*100, 100), goodFn: v=>v>=1 },
      { lbl: "Screen Time", val: payload.avg_daily_usage_hours, max: 12, pct: Math.max(100 - payload.avg_daily_usage_hours/8*100, 0), goodFn: v=>v<=4 },
    ];

    breakdownList.innerHTML = items.map(i => {
      const cls = i.pct >= 70 ? "good" : i.pct >= 40 ? "ok" : "bad";
      return `
        <div class="bd-item">
          <div class="bd-hdr"><span class="bd-lbl">${i.lbl}</span><span class="bd-val">${i.val} hrs</span></div>
          <div class="bd-bar"><div class="bd-fill ${cls}" style="width: ${i.pct}%"></div></div>
        </div>
      `;
    }).join("");
  }

  // ── HISTORY ───────────────────────────────────────────
  function saveHistory(score, band) {
    const history = JSON.parse(localStorage.getItem("mm-hist") || "[]");
    history.unshift({ score, label: band.label, ts: Date.now() });
    localStorage.setItem("mm-hist", JSON.stringify(history.slice(0, 10)));
    renderHistory();
  }

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem("mm-hist") || "[]");
    if (history.length === 0) {
      historyRow.innerHTML = `<p class="no-history">No history yet</p>`;
      return;
    }
    historyRow.innerHTML = history.map(h => {
      const time = new Date(h.ts).toLocaleDateString([], { month: "short", day: "numeric" });
      return `
        <div class="h-card">
          <div class="h-score">${h.score.toFixed(2)}</div>
          <div class="h-band">${h.label}</div>
          <div class="h-time">${time}</div>
        </div>
      `;
    }).join("");
  }
  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem("mm-hist");
    renderHistory();
  });
  renderHistory();

  // ── ACTIONS ───────────────────────────────────────────
  function redo() {
    resultScreen.hidden = true;
    wizardShell.hidden = false;
    goToStep(1);
    form.reset();
    stressCards.forEach(c => c.classList.remove("active"));
    usageFill.style.width = "0%";
    rgFill.style.strokeDashoffset = "345";
    rgNeedle.style.transform = "rotate(-90deg)";
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  redoBtn.addEventListener("click", redo);
  errRetryBtn.addEventListener("click", redo);

  shareBtn.addEventListener("click", () => {
    const text = `My MindMetric score is ${rsScoreNum.textContent}/10! Check yours.`;
    if (navigator.share) navigator.share({ text });
    else {
      navigator.clipboard.writeText(text);
      shareBtn.textContent = "Copied!";
      setTimeout(() => shareBtn.innerHTML = `Share`, 2000);
    }
  });

  // ── CONFETTI ──────────────────────────────────────────
  function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#e8a045", "#14b8a6", "#fbf5ee"];
    const particles = Array.from({length: 80}, () => ({
      x: Math.random() * canvas.width, y: -20,
      vx: (Math.random()-0.5)*4, vy: Math.random()*4+2,
      size: Math.random()*6+4, color: colors[Math.floor(Math.random()*3)],
      rot: Math.random()*360, spin: (Math.random()-0.5)*8, alpha: 1
    }));
    const tick = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rot += p.spin;
        if (p.y > canvas.height * 0.8) p.alpha -= 0.02;
        if (p.alpha > 0) {
          alive = true; ctx.save(); ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color; ctx.translate(p.x, p.y); ctx.rotate(p.rot*Math.PI/180);
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size); ctx.restore();
        }
      });
      if (alive) requestAnimationFrame(tick);
      else ctx.clearRect(0,0,canvas.width,canvas.height);
    };
    tick();
  }
  // ── AUTHENTICATION & DASHBOARD ────────────────────────
  const authUiContainer = document.getElementById("auth-ui");
  const authModal = document.getElementById("auth-modal");
  const authClose = document.getElementById("auth-close");
  const authForm = document.getElementById("auth-form");
  const authEmail = document.getElementById("auth-email");
  const authPassword = document.getElementById("auth-password");
  const authError = document.getElementById("auth-error");
  const authSubmitBtn = document.getElementById("auth-submit-btn");
  const authSwitchBtn = document.getElementById("auth-switch-btn");
  const authTitle = document.getElementById("auth-title");
  const authSub = document.getElementById("auth-sub");
  const authSwitchText = document.getElementById("auth-switch-text");

  const dashModal = document.getElementById("dash-modal");
  const dashClose = document.getElementById("dash-close");
  const logoutBtn = document.getElementById("logout-btn");
  const dbHistoryList = document.getElementById("db-history-list");
  
  let isLoginMode = true;
  let chartInstance = null;
  let currentStreak = 0;

  async function updateAuthUI() {
    const token = localStorage.getItem("mm-token");
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/user/profile`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
          const profile = await res.json();
          currentStreak = profile.streak_count;
        }
      } catch (e) {}

      authUiContainer.innerHTML = `
        <span id="nav-streak" style="color:var(--amber); font-weight:bold; font-size:13px;">🔥 ${currentStreak} Day Streak</span>
        <button class="btn-dash" id="nav-dash-btn">My Dashboard</button>
      `;
      document.getElementById("nav-dash-btn").addEventListener("click", openDashboard);
    } else {
      authUiContainer.innerHTML = `
        <button class="btn-login" id="nav-login-btn">Log In</button>
        <button class="btn-dash" id="nav-register-btn">Sign Up</button>
      `;
      document.getElementById("nav-login-btn").addEventListener("click", () => openAuthModal(true));
      document.getElementById("nav-register-btn").addEventListener("click", () => openAuthModal(false));
    }
  }

  function openAuthModal(login) {
    isLoginMode = login;
    authError.textContent = "";
    authForm.reset();
    if (isLoginMode) {
      authTitle.textContent = "Welcome Back";
      authSub.textContent = "Log in to save your wellness scores securely.";
      authSubmitBtn.textContent = "Log In";
      authSwitchText.textContent = "Don't have an account?";
      authSwitchBtn.textContent = "Sign Up";
    } else {
      authTitle.textContent = "Create Account";
      authSub.textContent = "Sign up to track your mental health signal over time.";
      authSubmitBtn.textContent = "Sign Up";
      authSwitchText.textContent = "Already have an account?";
      authSwitchBtn.textContent = "Log In";
    }
    authModal.hidden = false;
  }
  
  authClose.addEventListener("click", () => authModal.hidden = true);
  authSwitchBtn.addEventListener("click", () => openAuthModal(!isLoginMode));

  authForm.addEventListener("submit", async e => {
    e.preventDefault();
    authError.textContent = "";
    const email = authEmail.value.trim();
    const password = authPassword.value;
    
    authSubmitBtn.textContent = "Please wait...";
    authSubmitBtn.disabled = true;

    try {
      if (isLoginMode) {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params
        });
        if (!res.ok) {
          const text = await res.text();
          try {
             const data = JSON.parse(text);
             throw new Error(data.detail || "Incorrect email or password");
          } catch(e) {
             throw new Error("Server error. Please try again.");
          }
        }
        const data = await res.json();
        localStorage.setItem("mm-token", data.access_token);
        authModal.hidden = true;
        updateAuthUI();
      } else {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
          const text = await res.text();
          try {
             const data = JSON.parse(text);
             throw new Error(data.detail || "Registration failed");
          } catch(e) {
             throw new Error("Server error. Please try again.");
          }
        }
        // Auto login after register
        openAuthModal(true);
        authEmail.value = email;
        authError.textContent = "Account created! Please log in.";
        authError.style.color = "var(--teal)";
      }
    } catch(err) {
      authError.style.color = "var(--error)";
      authError.textContent = err.message;
    } finally {
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = isLoginMode ? "Log In" : "Sign Up";
    }
  });

  dashClose.addEventListener("click", () => dashModal.hidden = true);
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("mm-token");
    dashModal.hidden = true;
    updateAuthUI();
  });

  async function openDashboard() {
    dashModal.hidden = false;
    const token = localStorage.getItem("mm-token");
    
    // Load History
    dbHistoryList.innerHTML = "Loading...";
    try {
      const hRes = await fetch(`${API_BASE}/history`, { headers: { "Authorization": `Bearer ${token}` } });
      if (hRes.ok) {
        const historyData = await hRes.json();
        if (historyData.length === 0) {
          dbHistoryList.innerHTML = "<p>No predictions saved yet.</p>";
        } else {
          dbHistoryList.innerHTML = historyData.map(h => {
            const date = new Date(h.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            return `<div class="hl-item"><span class="hl-score">${h.score.toFixed(2)}</span><span class="hl-date">${date}</span></div>`;
          }).join("");
        }
      }
      
      const aRes = await fetch(`${API_BASE}/analytics`, { headers: { "Authorization": `Bearer ${token}` } });
      if (aRes.ok) {
        const analyticsData = await aRes.json();
        renderChart(analyticsData.labels, analyticsData.scores);
      }
    } catch(err) {
      console.error(err);
      dbHistoryList.innerHTML = "<p>Error loading data</p>";
    }
  }

  function renderChart(labels, data) {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Mental Health Score',
          data: data,
          borderColor: '#2dd4bf',
          backgroundColor: 'rgba(45, 212, 191, 0.2)',
          borderWidth: 3,
          pointBackgroundColor: '#fbbf24',
          pointBorderColor: '#0f0c0a',
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            grid: { color: '#382e27' },
            ticks: { color: '#d6c9be' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#d6c9be' }
          }
        }
      }
    });
  }

  // Init Auth UI on load
  updateAuthUI();

})();
