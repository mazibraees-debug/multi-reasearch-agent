// ============================================================
// NeuroAgent - App Controller
// UI state management and pipeline orchestration
// ============================================================

// ─── State ────────────────────────────────────────────────────
const state = {
  apiKey: "",
  model: localStorage.getItem("neuro_model") || "meta-llama/llama-3.3-70b-instruct",
  running: false,
  results: null,
  activeTab: "report",
  startTime: null,
  timerInterval: null
};

// ─── DOM References ────────────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
  apiSetup: $("apiSetup"),
  pipelineSection: $("pipelineSection"),
  querySection: $("querySection"),
  logsSection: $("logsSection"),
  resultsSection: $("resultsSection"),
  apiKeyInput: $("apiKeyInput"),
  saveKeyBtn: $("saveKeyBtn"),
  modelSelect: $("modelSelect"),
  queryInput: $("queryInput"),
  depthSelect: $("depthSelect"),
  runBtn: $("runBtn"),
  logsContainer: $("logsContainer"),
  resultsContent: $("resultsContent"),
  statusDot: $("statusDot"),
  statusText: $("statusText"),
  totalTokens: $("totalTokens"),
  agentsCalled: $("agentsCalled"),
  timeElapsed: $("timeElapsed"),
  modelUsed: $("modelUsed"),
  clearLogsBtn: $("clearLogsBtn"),
  copyLogsBtn: $("copyLogsBtn"),
  copyReportBtn: $("copyReportBtn"),
  exportBtn: $("exportBtn"),
  newQueryBtn: $("newQueryBtn"),
  statsBar: $("statsBar")
};

// ─── Init ──────────────────────────────────────────────────────

function init() {
  // Restore model
  if (state.model && els.modelSelect) {
    els.modelSelect.value = state.model;
  }

  // If API key exists, skip setup
  if (state.apiKey) {
    els.apiKeyInput.value = "••••••••••••••••";
    showMainUI();
  }

  bindEvents();
}

function bindEvents() {
  // API key save
  els.saveKeyBtn.addEventListener("click", handleSaveKey);
  els.apiKeyInput.addEventListener("keydown", e => { if (e.key === "Enter") handleSaveKey(); });

  // Model select
  els.modelSelect.addEventListener("change", () => {
    state.model = els.modelSelect.value;
    localStorage.setItem("neuro_model", state.model);
  });

  // Run pipeline
  els.runBtn.addEventListener("click", handleRun);
  els.queryInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.ctrlKey) handleRun();
  });

  // Log controls
  els.clearLogsBtn.addEventListener("click", () => {
    els.logsContainer.innerHTML = "";
  });

  els.copyLogsBtn.addEventListener("click", () => {
    const text = [...els.logsContainer.querySelectorAll(".log-entry")]
      .map(e => {
        const time = e.querySelector(".log-time")?.textContent || "";
        const agent = e.querySelector(".log-agent")?.textContent || "";
        const msg = e.querySelector(".log-msg")?.textContent || "";
        return `[${time}] ${agent}: ${msg}`;
      }).join("\n");
    navigator.clipboard.writeText(text);
    showToast("Logs copied!");
  });

  // Report controls
  els.copyReportBtn.addEventListener("click", () => {
    if (state.results?.report) {
      navigator.clipboard.writeText(state.results.report);
      showToast("Report copied!");
    }
  });

  els.exportBtn.addEventListener("click", () => {
    if (state.results?.report) {
      const blob = new Blob([state.results.report], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neuroagent-report-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Exported!");
    }
  });

  els.newQueryBtn.addEventListener("click", () => {
    els.resultsSection.style.display = "none";
    els.logsSection.style.display = "none";
    resetAgents();
    setStatus("idle");
    els.queryInput.value = "";
    els.queryInput.focus();
  });

  // Tabs
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.activeTab = tab.dataset.tab;
      renderTab(state.activeTab);
    });
  });
}

// ─── API Key ──────────────────────────────────────────────────

async function handleSaveKey() {
  // Key is now handled on backend, but we'll simulate the UI transition
  showMainUI();
  showToast("System ready (Backend Auth)");
}

function showMainUI() {
  els.apiSetup.style.display = "none";
  els.pipelineSection.style.display = "block";
  els.querySection.style.display = "block";
  els.modelSelect.value = state.model;
}

async function handleRun() {
  const query = els.queryInput.value.trim();
  if (!query) { showToast("Please enter a research query", "error"); return; }
  if (state.running) return;

  state.running = true;
  state.results = null;
  els.runBtn.disabled = true;
  els.runBtn.querySelector("span:last-child").textContent = "Running...";

  // Reset UI
  els.logsSection.style.display = "block";
  els.resultsSection.style.display = "none";
  els.logsContainer.innerHTML = "";
  resetAgents();
  setStatus("active");
  addLog("system", "Connecting to Python backend...", "info", new Date().toLocaleTimeString());

  // Start timer
  state.startTime = Date.now();
  state.timerInterval = setInterval(() => {
    const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);
    els.timeElapsed.textContent = elapsed + "s";
  }, 100);

  try {
    addLog("system", "Research pipeline initiated. This may take a minute...", "info", new Date().toLocaleTimeString());
    
    const response = await fetch('/run-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        model: els.modelSelect.value,
        depth: els.depthSelect.value
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Backend error");
    }

    const results = await response.json();
    state.results = results;

    // Simulate logs for the agents
    addLog("planner", "Plan finalized", "success", new Date().toLocaleTimeString());
    updateAgent("planner", "done");
    addLog("researcher", "Knowledge extracted", "success", new Date().toLocaleTimeString());
    updateAgent("researcher", "done");
    addLog("critic", "Analysis complete", "success", new Date().toLocaleTimeString());
    updateAgent("critic", "done");
    addLog("synthesizer", "Synthesis merged", "success", new Date().toLocaleTimeString());
    updateAgent("synthesizer", "done");
    addLog("writer", "Report written", "success", new Date().toLocaleTimeString());
    updateAgent("writer", "done");

    els.totalTokens.textContent = results.totalTokens.toLocaleString();
    els.modelUsed.textContent = els.modelSelect.value.split("/").pop().substring(0, 12);
    
    els.resultsSection.style.display = "block";
    renderContent(results.report);
    setStatus("done");
    showToast("Research complete!", "success");

  } catch (err) {
    addLog("system", "Pipeline failed: " + err.message, "error", new Date().toLocaleTimeString());
    setStatus("error");
    showToast("Error: " + err.message, "error");
  } finally {
    state.running = false;
    els.runBtn.disabled = false;
    els.runBtn.querySelector("span:last-child").textContent = "Run Pipeline";
    clearInterval(state.timerInterval);
  }
}

// ─── Agent UI Updates ─────────────────────────────────────────

function updateAgent(agentId, status) {
  const node = document.getElementById(`agent-${agentId}`);
  if (!node) return;
  node.className = `agent-node ${status}`;
  const statusEl = node.querySelector(".agent-status");
  if (statusEl) {
    statusEl.textContent = status === "active" ? "RUNNING" : status === "done" ? "DONE ✓" : status.toUpperCase();
  }
}

function resetAgents() {
  ["planner", "researcher", "critic", "synthesizer", "writer"].forEach(id => {
    const node = document.getElementById(`agent-${id}`);
    if (node) {
      node.className = "agent-node";
      const statusEl = node.querySelector(".agent-status");
      if (statusEl) statusEl.textContent = "READY";
    }
  });
}

// ─── Log System ───────────────────────────────────────────────

function addLog(agent, msg, type, time) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML = `
    <span class="log-time">${time}</span>
    <span class="log-agent ${agent}">[${agent.toUpperCase()}]</span>
    <span class="log-msg ${type}">${escapeHtml(msg)}</span>
  `;
  els.logsContainer.appendChild(entry);
  els.logsContainer.scrollTop = els.logsContainer.scrollHeight;
}

// ─── Results Rendering ────────────────────────────────────────

function renderTab(tab) {
  if (!state.results) return;
  let content = "";
  switch (tab) {
    case "report": content = state.results.report || "No report yet"; break;
    case "plan": content = JSON.stringify(state.results.plan, null, 2); break;
    case "critique": content = state.results.critique || "No critique"; break;
    case "raw": content = `=== RESEARCH ===\n\n${state.results.research || ""}\n\n=== SYNTHESIS ===\n\n${state.results.synthesis || ""}`; break;
  }
  renderContent(content);
}

function renderContent(content) {
  // Simple markdown-like rendering
  const html = content
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$2</h2>'.replace('$2', '$1'))
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr style="border:1px solid var(--border);margin:16px 0">')
    .replace(/\n/g, '<br>');

  els.resultsContent.innerHTML = html;
  els.resultsSection.style.display = "block";
}

// ─── Status ───────────────────────────────────────────────────

function setStatus(status) {
  els.statusDot.className = "status-dot";
  if (status === "active") {
    els.statusDot.classList.add("active");
    els.statusText.textContent = "RUNNING";
  } else if (status === "done") {
    els.statusDot.classList.add("done");
    els.statusText.textContent = "COMPLETE";
  } else if (status === "error") {
    els.statusDot.classList.add("error");
    els.statusText.textContent = "ERROR";
  } else {
    els.statusText.textContent = "IDLE";
  }
}

// ─── Toast Notifications ──────────────────────────────────────

function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: ${type === "error" ? "#ff6b6b" : "var(--accent)"};
    color: ${type === "error" ? "#fff" : "#000"};
    padding: 12px 20px; border-radius: 8px;
    font-family: var(--font-mono); font-size: 12px; font-weight: 700;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = msg;

  const style = document.createElement("style");
  style.textContent = "@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}";
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ─── Utils ────────────────────────────────────────────────────

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ─── Start ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
