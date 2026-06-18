(function () {
  "use strict";

  const START_VALUE = 100;
  const MAX_DRAWDOWN = 15;
  const POLL_INTERVAL_MS = 15000;
  const SCAN_INTERVAL_SECONDS = 1800;
  const EXPLORER_BASE = "https://testnet.bscscan.com/tx/";

  const state = {
    cyclesLength: 0,
    lastUpdatedAt: 0,
    nextScanSeconds: SCAN_INTERVAL_SECONDS,
    seenLogKeys: new Set()
  };

  const els = {
    statusDot: document.getElementById("status-dot"),
    cycleNumber: document.getElementById("cycle-number"),
    statusLabel: document.getElementById("status-label"),
    portfolioValue: document.getElementById("portfolio-value"),
    pnlLine: document.getElementById("pnl-line"),
    drawdownLine: document.getElementById("drawdown-line"),
    drawdownFill: document.getElementById("drawdown-fill"),
    cyclesRun: document.getElementById("cycles-run"),
    tradesExecuted: document.getElementById("trades-executed"),
    avgScore: document.getElementById("avg-score"),
    llmUsed: document.getElementById("llm-used"),
    nextScan: document.getElementById("next-scan"),
    updatedAge: document.getElementById("updated-age"),
    cycleFeed: document.getElementById("cycle-feed"),
    terminalLog: document.getElementById("terminal-log")
  };

  function fetchJson(path) {
    return fetch(`${path}?t=${Date.now()}`, { cache: "no-store" }).then((response) => {
      if (!response.ok) {
        throw new Error("fetch failed");
      }
      return response.json();
    });
  }

  function toNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function formatMoney(value) {
    return Number.isFinite(value) ? `$${value.toFixed(2)}` : "$—";
  }

  function formatPercent(value) {
    return Number.isFinite(value) ? `${value.toFixed(1)}%` : "—";
  }

  function formatAge(timestamp) {
    const date = new Date(timestamp);
    const time = date.getTime();
    if (!Number.isFinite(time)) {
      return "—";
    }

    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 60) {
      return `${seconds}s ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    return `${Math.floor(hours / 24)}d ago`;
  }

  function formatCountdown(seconds) {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = String(safeSeconds % 60).padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  function truncateHash(hash) {
    if (!hash || hash.length <= 14) {
      return hash || "";
    }

    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  }

  function getDecision(cycle) {
    if (cycle && typeof cycle.decision === "string") {
      const decision = cycle.decision.toUpperCase();
      return decision === "BUY" || decision === "FAILED" ? decision : "HOLD";
    }

    const action = String(cycle && cycle.decision && cycle.decision.action ? cycle.decision.action : cycle && cycle.status ? cycle.status : "HOLD").toUpperCase();
    const status = String(cycle && cycle.status ? cycle.status : "").toUpperCase();

    if (status.includes("FAILED") || status.includes("ERROR")) {
      return "FAILED";
    }

    if (action === "BUY") {
      return "BUY";
    }

    return "HOLD";
  }

  function getDecisionClass(decision) {
    if (decision === "BUY") {
      return "buy";
    }
    if (decision === "FAILED") {
      return "failed";
    }
    return "hold";
  }

  function getDecisionTextClass(decision) {
    if (decision === "BUY") {
      return "is-buy";
    }
    if (decision === "FAILED") {
      return "is-fail";
    }
    return "is-hold-text";
  }

  function getNarrativeName(cycle) {
    const raw = cycle && typeof cycle.narrativeName === "string" ? cycle.narrativeName.trim() : "";
    // Treat blank or generic placeholder as unknown
    if (!raw || raw.toLowerCase() === "unknown narrative" || raw.toLowerCase() === "unknown") {
      return null;
    }
    return raw;
  }

  function getScore(cycle) {
    return toNumber(cycle && cycle.score !== undefined ? cycle.score : cycle && cycle.decision && cycle.decision.score, NaN);
  }

  function getScoreText(score) {
    if (!Number.isFinite(score) || score === 0) {
      return "—";
    }

    return `${score.toFixed(score % 1 === 0 ? 0 : 1)} / 10`;
  }

  function getScoreBreakdown(cycle) {
    return cycle && cycle.scoreBreakdown && typeof cycle.scoreBreakdown === "object"
      ? cycle.scoreBreakdown
      : null;
  }

  function getDotClass(value, max) {
    const score = toNumber(value, 0);
    if (score <= 0) {
      return "";
    }

    const ratio = score / max;
    if (ratio >= 0.67) {
      return "filled high";
    }
    if (ratio >= 0.34) {
      return "filled mid";
    }
    return "filled low";
  }

  function renderScoreDots(cycle) {
    const breakdown = getScoreBreakdown(cycle);
    const parts = [
      ["momentum", 3],
      ["catalyst", 3],
      ["regime", 2],
      ["safety", 2]
    ];

    return `<span class="score-dots" aria-hidden="true">${parts.map(([key, max]) => {
      const dotClass = breakdown ? getDotClass(breakdown[key], max) : "";
      return `<span class="score-dot ${dotClass}"></span>`;
    }).join("")}</span>`;
  }

  function formatLlm(value) {
    const llm = typeof value === "string" ? value.toLowerCase() : "";
    if (llm === "groq") {
      return "Groq";
    }
    if (llm === "gemini") {
      return "Gemini";
    }
    return "—";
  }

  function sanitizeReasoning(text) {
    if (!text) return "";
    const s = String(text);
    // Raw HTTP URLs indicate an LLM routing failure
    if (s.startsWith("http")) {
      return "LLM scoring failed";
    }
    // Gemini API error strings
    if (s.includes("generateContent")) {
      return "Gemini API unavailable";
    }
    return s;
  }

  function getLatestLlm(cycles) {
    for (let index = cycles.length - 1; index >= 0; index -= 1) {
      if (cycles[index] && cycles[index].llmUsed) {
        return formatLlm(cycles[index].llmUsed);
      }
    }
    return "—";
  }

  function renderPortfolio(portfolio, cycles) {
    const currentValue = toNumber(portfolio && portfolio.currentValue, NaN);
    const peakValue = toNumber(portfolio && portfolio.peakValue, START_VALUE);
    const pnl = currentValue - START_VALUE;
    const pnlPercent = START_VALUE > 0 ? pnl / START_VALUE * 100 : NaN;
    const drawdown = peakValue > 0 ? Math.max(0, (peakValue - currentValue) / peakValue * 100) : NaN;
    const drawdownWidth = Number.isFinite(drawdown) ? Math.min(100, drawdown / MAX_DRAWDOWN * 100) : 0;
    const trades = Array.isArray(portfolio && portfolio.tradesHistory) ? portfolio.tradesHistory : [];
    const scores = cycles.map(getScore).filter((score) => Number.isFinite(score));
    const avgScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : NaN;

    els.portfolioValue.textContent = formatMoney(currentValue);
    els.pnlLine.textContent = Number.isFinite(pnl) ? `${pnl >= 0 ? "+" : "-"}${formatMoney(Math.abs(pnl))} (${pnlPercent >= 0 ? "+" : ""}${formatPercent(pnlPercent)})` : "—";
    els.pnlLine.className = `pnl-line ${pnl >= 0 ? "is-buy" : "is-fail"}`;
    els.drawdownLine.textContent = `Drawdown: ${formatPercent(drawdown)} / 15% max`;
    els.drawdownFill.style.width = `${drawdownWidth}%`;
    els.drawdownFill.style.background = drawdown >= 10 ? "var(--fail)" : drawdown >= 5 ? "var(--hold)" : "var(--buy)";
    els.cyclesRun.textContent = String(cycles.length || "—");
    els.tradesExecuted.textContent = String(trades.length || "—");
    els.avgScore.textContent = Number.isFinite(avgScore) ? avgScore.toFixed(1) : "—";
    els.llmUsed.textContent = getLatestLlm(cycles);
  }

  function renderCycles(cycles) {
    const recent = cycles.slice(-10).reverse();

    if (recent.length === 0) {
      els.cycleFeed.innerHTML = '<div class="empty-state">No cycles recorded.</div>';
      return;
    }

    els.cycleFeed.innerHTML = recent.map((cycle) => {
      const decision = getDecision(cycle);
      const decisionClass = getDecisionClass(decision);
      const textClass = getDecisionTextClass(decision);
      const narrativeName = getNarrativeName(cycle);
      const score = getScore(cycle);
      const scoreText = getScoreText(score);
      const rawReasoning = cycle && cycle.reasoning ? String(cycle.reasoning) : cycle && cycle.decision && cycle.decision.reasoning ? String(cycle.decision.reasoning) : "";
      const reasoning = sanitizeReasoning(rawReasoning);
      const route = decision === "BUY" ? " · VIRTUAL via PancakeSwap" : "";
      const regime = cycle && cycle.marketRegime ? String(cycle.marketRegime).toUpperCase() : "—";
      const fearGreed = cycle && cycle.fearGreed !== null && cycle.fearGreed !== undefined && Number.isFinite(Number(cycle.fearGreed)) ? `F&G: ${Number(cycle.fearGreed).toFixed(0)}` : "";
      const txHash = getTxHash(cycle);
      const tx = decision === "BUY" && txHash ? `<div class="tx-line"><span class="tx-label">TX</span><a class="tx-link" href="${EXPLORER_BASE}${encodeURIComponent(txHash)}" target="_blank" rel="noreferrer">${truncateHash(txHash)}</a></div>` : "";
      const reason = reasoning ? `<div class="reasoning">${escapeHtml(reasoning)}</div>` : "";

      // FIX 4: render unknown/missing narrative name as an em-dash in muted italic
      const nameHtml = narrativeName
        ? `<div class="narrative-name">${escapeHtml(narrativeName)}</div>`
        : `<div class="narrative-name" style="color:var(--text-3);font-style:italic">—</div>`;

      return `
        <article class="cycle-card ${decisionClass}">
          <div class="cycle-row">
            ${nameHtml}
            <div class="cycle-score ${textClass}">${renderScoreDots(cycle)}<span class="score-value">${scoreText}</span></div>
          </div>
          <div class="cycle-row">
            <div class="decision-line"><span class="regime-badge">${escapeHtml(regime)}</span><span class="decision-chip ${textClass}">${decision}</span>${route}</div>
            <div class="cycle-meta">${fearGreed}</div>
          </div>
          ${reason}
          ${tx}
        </article>
      `;
    }).join("");
  }

  function updateHeader(portfolio, cycles) {
    const lastCycle = cycles[cycles.length - 1];
    const isPaused = Boolean(portfolio && portfolio.isPaused);
    const decision = getDecision(lastCycle);
    let label = "ACTIVE";
    let dotClass = "status-dot is-active";

    if (isPaused || decision === "FAILED") {
      label = "PAUSED";
      dotClass = "status-dot is-paused";
    } else if (decision === "HOLD") {
      label = "HOLD";
      dotClass = "status-dot is-hold";
    }

    els.statusLabel.textContent = label;
    els.cycleNumber.textContent = lastCycle && lastCycle.cycleNumber ? `#${lastCycle.cycleNumber}` : cycles.length ? `#${cycles.length}` : "#—";
    els.statusDot.className = dotClass;
  }

  function appendLogs(cycles) {
    const lines = [];

    cycles.forEach((cycle, index) => {
      const timestamp = cycle && cycle.timestamp ? cycle.timestamp : "";
      const logs = Array.isArray(cycle && cycle.logs) ? cycle.logs : Array.isArray(cycle && cycle.log) ? cycle.log : [];

      logs.forEach((line, lineIndex) => {
        lines.push({
          key: `${timestamp}:${index}:log:${lineIndex}:${line}`,
          text: String(line)
        });
      });

      if (logs.length === 0) {
        const decision = getDecision(cycle);
        const scoreValue = cycle && cycle.score !== undefined ? cycle.score : cycle && cycle.decision && cycle.decision.score;
        const score = Number.isFinite(Number(scoreValue)) ? Number(scoreValue).toFixed(1) : "—";
        const token = cycle && cycle.trade && cycle.trade.token ? cycle.trade.token : cycle && cycle.decision && cycle.decision.token ? cycle.decision.token : "market";

        lines.push({
          key: `${timestamp}:${index}:cycle`,
          text: `📊 ${formatLogTime(timestamp)} cycle ${decision} ${token} score ${score}`
        });

        const txHash = getTxHash(cycle);
        if (txHash) {
          lines.push({
            key: `${timestamp}:${index}:tx:${txHash}`,
            text: `✅ ${formatLogTime(timestamp)} tx ${truncateHash(txHash)}`
          });
        }

        if (cycle && cycle.error) {
          lines.push({
            key: `${timestamp}:${index}:error:${cycle.error}`,
            text: `❌ ${formatLogTime(timestamp)} ${String(cycle.error).split("\n")[0]}`
          });
        } else if (decision === "FAILED" && cycle && cycle.reasoning) {
          lines.push({
            key: `${timestamp}:${index}:failed:${cycle.reasoning}`,
            text: `❌ ${formatLogTime(timestamp)} ${String(cycle.reasoning).split("\n")[0]}`
          });
        }
      }
    });

    lines.forEach((line) => {
      if (state.seenLogKeys.has(line.key)) {
        return;
      }

      state.seenLogKeys.add(line.key);
      const div = document.createElement("div");
      div.className = `log-line ${getLogClass(line.text)}`;
      div.textContent = line.text;
      els.terminalLog.appendChild(div);
    });

    els.terminalLog.scrollTop = els.terminalLog.scrollHeight;
  }

  function getLogClass(line) {
    if (line.startsWith("✅")) {
      return "log-buy";
    }
    if (line.startsWith("❌")) {
      return "log-fail";
    }
    if (line.startsWith("⚠️")) {
      return "log-hold";
    }
    if (line.startsWith("📊")) {
      return "log-accent";
    }
    if (line.startsWith("🔄") || line.startsWith("🤖") || line.startsWith("🏦") || line.startsWith("💼")) {
      return "log-muted";
    }
    return "";
  }

  function formatLogTime(timestamp) {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) {
      return "--:--:--";
    }

    return date.toISOString().slice(11, 19);
  }

  function getTxHash(cycle) {
    if (cycle && cycle.trade && cycle.trade.txHash) {
      return String(cycle.trade.txHash);
    }
    return cycle && cycle.txHash ? String(cycle.txHash) : "";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setEmptyValues() {
    els.portfolioValue.textContent = "$—";
    els.pnlLine.textContent = "—";
    els.pnlLine.className = "pnl-line";
    els.drawdownLine.textContent = "Drawdown: — / 15% max";
    els.drawdownFill.style.width = "0";
    els.cyclesRun.textContent = "—";
    els.tradesExecuted.textContent = "—";
    els.avgScore.textContent = "—";
    els.llmUsed.textContent = "—";
  }

  function updateTimers() {
    if (state.lastUpdatedAt) {
      const seconds = Math.max(0, Math.floor((Date.now() - state.lastUpdatedAt) / 1000));
      els.updatedAge.textContent = `Updated ${seconds}s ago`;
    } else {
      els.updatedAge.textContent = "Updated —";
    }

    els.nextScan.textContent = `Next scan ${formatCountdown(state.nextScanSeconds)}`;
  }

  function tickCountdown() {
    state.nextScanSeconds = Math.max(0, state.nextScanSeconds - 1);
    updateTimers();
  }

  function poll() {
    Promise.all([
      fetchJson("../logs/cycles.json"),
      fetchJson("../logs/portfolio.json")
    ])
      .then(([cyclesData, portfolio]) => {
        const cycles = Array.isArray(cyclesData) ? cyclesData : [];

        if (cycles.length !== state.cyclesLength) {
          state.nextScanSeconds = SCAN_INTERVAL_SECONDS;
          state.cyclesLength = cycles.length;
        }

        renderPortfolio(portfolio || {}, cycles);
        renderCycles(cycles);
        appendLogs(cycles);
        updateHeader(portfolio || {}, cycles);
        state.lastUpdatedAt = Date.now();
        updateTimers();
      })
      .catch(() => {
        setEmptyValues();
        updateTimers();
      });
  }

  poll();
  window.setInterval(poll, POLL_INTERVAL_MS);
  window.setInterval(tickCountdown, 1000);
})();
