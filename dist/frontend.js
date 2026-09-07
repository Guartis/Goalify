// src/frontend.ts
var ICON = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="10" cy="10" r="0.75" fill="currentColor"/>
</svg>`;
function setup(ctx) {
  const removeStyle = ctx.dom.addStyle(`
    .goalify-root { padding: 14px; display: flex; flex-direction: column; gap: 16px; }
    .goalify-empty { color: var(--lumiverse-text-dim); font-size: 13px; padding: 24px 4px; text-align: center; }
    .goalify-section { border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius); padding: 12px; background: var(--lumiverse-fill-subtle); }
    .goalify-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 8px; }
    .goalify-title { font-size: 13px; font-weight: 600; color: var(--lumiverse-text); }
    .goalify-badge { font-size: 10.5px; padding: 2px 7px; border-radius: 999px; border: 1px solid var(--lumiverse-border); color: var(--lumiverse-text-muted); white-space: nowrap; }
    .goalify-badge.ai { color: var(--lumiverse-accent-fg); background: var(--lumiverse-accent); border-color: transparent; }
    .goalify-textarea { width: 100%; min-height: 64px; resize: vertical; padding: 8px 10px; background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius); color: var(--lumiverse-text); font-size: 13px; font-family: inherit; box-sizing: border-box; }
    .goalify-textarea::placeholder { color: var(--lumiverse-text-dim); }
    .goalify-row { display: flex; gap: 8px; margin-top: 8px; align-items: center; }
    .goalify-btn { font-size: 12px; padding: 6px 10px; border-radius: var(--lumiverse-radius); border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill); color: var(--lumiverse-text); cursor: pointer; transition: border-color var(--lumiverse-transition-fast); }
    .goalify-btn:hover { border-color: var(--lumiverse-border-hover); }
    .goalify-btn:disabled { opacity: 0.5; cursor: default; }
    .goalify-btn.primary { background: var(--lumiverse-accent); color: var(--lumiverse-accent-fg); border-color: transparent; }
    .goalify-hint { font-size: 11px; color: var(--lumiverse-text-dim); margin-top: 6px; }
    .goalify-intervals { display: flex; gap: 14px; flex-wrap: wrap; }
    .goalify-field { display: flex; flex-direction: column; gap: 4px; }
    .goalify-field label { font-size: 11px; color: var(--lumiverse-text-muted); }
    .goalify-field input { width: 72px; padding: 5px 8px; background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius); color: var(--lumiverse-text); font-size: 12.5px; }
    .goalify-counter { font-size: 11.5px; color: var(--lumiverse-text-dim); }
    .goalify-warn { font-size: 11.5px; color: var(--lumiverse-text-muted); background: var(--lumiverse-fill); border: 1px dashed var(--lumiverse-border); border-radius: var(--lumiverse-radius); padding: 8px 10px; }
  `);
  const tab = ctx.ui.registerDrawerTab({
    id: "goalify",
    title: "Goalify",
    shortName: "Goals",
    description: "Track long-term and short-term narrative goals for this chat",
    keywords: ["goal", "objective", "plot", "story", "arc", "focus"],
    headerTitle: "Goalify",
    iconSvg: ICON
  });
  const root = document.createElement("div");
  root.className = "goalify-root";
  tab.root.appendChild(root);
  let currentChatId = null;
  let currentState = null;
  let permissions = null;
  let longBusy = false;
  let shortBusy = false;
  function send(msg) {
    ctx.sendToBackend(msg);
  }
  function render() {
    root.replaceChildren();
    if (!currentChatId || !currentState) {
      const empty = document.createElement("div");
      empty.className = "goalify-empty";
      empty.textContent = "Open a chat to set up its goals.";
      root.appendChild(empty);
      return;
    }
    if (permissions && !permissions.generation) {
      const warn = document.createElement("div");
      warn.className = "goalify-warn";
      warn.textContent = 'Enable the "Generation" permission for Goalify in the Extensions panel to auto-generate and regenerate goals.';
      root.appendChild(warn);
    }
    root.appendChild(buildGoalSection("long"));
    root.appendChild(buildGoalSection("short"));
    root.appendChild(buildIntervalSection());
    const counter = document.createElement("div");
    counter.className = "goalify-counter";
    counter.textContent = describeProgress();
    root.appendChild(counter);
  }
  function describeProgress() {
    if (!currentState) return "";
    const { userMessageCount, longEvery, shortEvery } = currentState;
    const toLong = userMessageCount > 0 && userMessageCount % longEvery === 0 ? 0 : longEvery - userMessageCount % longEvery;
    const toShort = userMessageCount > 0 && userMessageCount % shortEvery === 0 ? 0 : shortEvery - userMessageCount % shortEvery;
    return `${userMessageCount} message${userMessageCount === 1 ? "" : "s"} sent \xB7 next long-term reminder in ${toLong} \xB7 next focus reminder in ${toShort}`;
  }
  function buildGoalSection(kind) {
    const goal = kind === "long" ? currentState.long : currentState.short;
    const busy = kind === "long" ? longBusy : shortBusy;
    const section = document.createElement("div");
    section.className = "goalify-section";
    const head = document.createElement("div");
    head.className = "goalify-section-head";
    const title = document.createElement("div");
    title.className = "goalify-title";
    title.textContent = kind === "long" ? "Long-term goal" : "Short-term focus";
    head.appendChild(title);
    const badge = document.createElement("span");
    badge.className = "goalify-badge" + (goal.source === "ai" ? " ai" : "");
    badge.textContent = goal.source === "ai" ? "AI-generated" : goal.source === "user" ? "Manually set" : "Not set";
    head.appendChild(badge);
    section.appendChild(head);
    const textarea = document.createElement("textarea");
    textarea.className = "goalify-textarea";
    textarea.placeholder = kind === "long" ? 'e.g. "Redemption of Kael" \u2014 the overarching story arc.' : 'e.g. "Give Mira a way to confront her fears" \u2014 the current chapter-level focus.';
    textarea.value = goal.text;
    textarea.disabled = busy;
    let dirty = false;
    textarea.addEventListener("input", () => {
      dirty = true;
    });
    section.appendChild(textarea);
    const row = document.createElement("div");
    row.className = "goalify-row";
    const saveBtn = document.createElement("button");
    saveBtn.className = "goalify-btn primary";
    saveBtn.textContent = "Save";
    saveBtn.disabled = busy;
    saveBtn.addEventListener("click", () => {
      if (!currentChatId) return;
      dirty = false;
      send({ type: kind === "long" ? "set_long" : "set_short", chatId: currentChatId, text: textarea.value });
    });
    row.appendChild(saveBtn);
    const regenBtn = document.createElement("button");
    regenBtn.className = "goalify-btn";
    regenBtn.textContent = busy ? "Generating\u2026" : "Regenerate";
    regenBtn.disabled = busy || !permissions?.generation;
    regenBtn.addEventListener("click", () => {
      if (!currentChatId) return;
      send({ type: kind === "long" ? "regenerate_long" : "regenerate_short", chatId: currentChatId });
    });
    row.appendChild(regenBtn);
    section.appendChild(row);
    if (kind === "short" && !currentState.long.text) {
      const hint = document.createElement("div");
      hint.className = "goalify-hint";
      hint.textContent = "Tip: setting a long-term goal first gives the short-term focus more to build on.";
      section.appendChild(hint);
    }
    return section;
  }
  function buildIntervalSection() {
    const section = document.createElement("div");
    section.className = "goalify-section";
    const title = document.createElement("div");
    title.className = "goalify-title";
    title.textContent = "Reminder frequency";
    title.style.marginBottom = "8px";
    section.appendChild(title);
    const row = document.createElement("div");
    row.className = "goalify-intervals";
    const longField = document.createElement("div");
    longField.className = "goalify-field";
    const longLabel = document.createElement("label");
    longLabel.textContent = "Long-term, every N msgs";
    const longInput = document.createElement("input");
    longInput.type = "number";
    longInput.min = "1";
    longInput.value = String(currentState.longEvery);
    longField.append(longLabel, longInput);
    const shortField = document.createElement("div");
    shortField.className = "goalify-field";
    const shortLabel = document.createElement("label");
    shortLabel.textContent = "Focus, every N msgs";
    const shortInput = document.createElement("input");
    shortInput.type = "number";
    shortInput.min = "1";
    shortInput.value = String(currentState.shortEvery);
    shortField.append(shortLabel, shortInput);
    row.append(longField, shortField);
    section.appendChild(row);
    const saveRow = document.createElement("div");
    saveRow.className = "goalify-row";
    const saveBtn = document.createElement("button");
    saveBtn.className = "goalify-btn";
    saveBtn.textContent = "Save frequency";
    saveBtn.addEventListener("click", () => {
      if (!currentChatId) return;
      const longEvery = parseInt(longInput.value, 10) || currentState.longEvery;
      const shortEvery = parseInt(shortInput.value, 10) || currentState.shortEvery;
      send({ type: "set_intervals", chatId: currentChatId, longEvery, shortEvery });
    });
    saveRow.appendChild(saveBtn);
    section.appendChild(saveRow);
    const hint = document.createElement("div");
    hint.className = "goalify-hint";
    hint.textContent = "Goals are reminded to the AI periodically rather than on every message. The focus goal is usually reminded more often than the long-term goal.";
    section.appendChild(hint);
    return section;
  }
  const unsubBackend = ctx.onBackendMessage((raw) => {
    const payload = raw;
    if (payload.type === "state") {
      currentChatId = payload.chatId;
      currentState = payload.state;
      permissions = payload.permissions;
      render();
    } else if (payload.type === "busy") {
      if (payload.chatId !== currentChatId) return;
      if (payload.which === "long") longBusy = payload.busy;
      else shortBusy = payload.busy;
      render();
    } else if (payload.type === "error") {
      console.warn("[Goalify]", payload.message);
    }
  });
  const unsubActivate = tab.onActivate(() => {
    send({ type: "get_state" });
  });
  send({ type: "get_state" });
  return () => {
    unsubBackend();
    unsubActivate();
    removeStyle();
    tab.destroy();
    ctx.dom.cleanup();
  };
}
export {
  setup
};
