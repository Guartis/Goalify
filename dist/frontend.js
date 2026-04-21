// src/frontend.ts
function setup(ctx) {
  const tab = ctx.ui.registerDrawerTab({
    id: "goals-tab",
    title: "Goals & Objectives",
    shortName: "Goals",
    description: "Manage goals and objectives for LLM injection",
    keywords: ["goals", "objectives", "inject", "council"],
    headerTitle: "Goals & Objectives",
    iconSvg: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="10" cy="10" r="1" fill="currentColor"/>
    </svg>`
  });
  const style = document.createElement("style");
  style.textContent = `
    .gobj-root {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 14px 12px;
      height: 100%;
      overflow-y: auto;
      box-sizing: border-box;
      font-family: inherit;
    }

    .gobj-section { display: flex; flex-direction: column; gap: 8px; }

    .gobj-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--lumiverse-text-dim, #888);
    }

    .gobj-input-row { display: flex; gap: 6px; }

    .gobj-input {
      flex: 1;
      padding: 7px 10px;
      font-size: 13px;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #333);
      border-radius: var(--lumiverse-radius, 6px);
      color: var(--lumiverse-text, #eee);
      outline: none;
      transition: border-color 0.15s;
    }
    .gobj-input:focus { border-color: var(--lumiverse-accent, #7c6ff7); }
    .gobj-input::placeholder { color: var(--lumiverse-text-dim, #666); }

    .gobj-add-btn {
      padding: 7px 13px;
      font-size: 13px;
      font-weight: 600;
      background: var(--lumiverse-accent, #7c6ff7);
      color: #fff;
      border: none;
      border-radius: var(--lumiverse-radius, 6px);
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .gobj-add-btn:hover { opacity: 0.85; }

    .gobj-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-height: 165px;
      overflow-y: auto;
    }
    .gobj-list::-webkit-scrollbar { width: 4px; }
    .gobj-list::-webkit-scrollbar-thumb {
      background: var(--lumiverse-border, #444);
      border-radius: 2px;
    }

    .gobj-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #2e2e2e);
      border-radius: var(--lumiverse-radius, 6px);
      font-size: 13px;
      color: var(--lumiverse-text, #eee);
      animation: gobj-in 0.15s ease;
      transition: border-color 0.2s, opacity 0.2s;
    }
    .gobj-item.done {
      opacity: 0.5;
      border-color: color-mix(in srgb, var(--lumiverse-accent, #7c6ff7) 25%, var(--lumiverse-border, #2e2e2e));
    }
    @keyframes gobj-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .gobj-check {
      flex-shrink: 0;
      width: 15px; height: 15px;
      appearance: none; -webkit-appearance: none;
      border: 1.5px solid var(--lumiverse-border, #555);
      border-radius: 3px;
      background: transparent;
      cursor: pointer;
      position: relative;
      transition: border-color 0.15s, background 0.15s;
    }
    .gobj-check:checked {
      background: var(--lumiverse-accent, #7c6ff7);
      border-color: var(--lumiverse-accent, #7c6ff7);
    }
    .gobj-check:checked::after {
      content: '';
      position: absolute;
      left: 3px; top: 0px;
      width: 5px; height: 8px;
      border: 2px solid #fff;
      border-top: none; border-left: none;
      transform: rotate(45deg);
    }

    .gobj-item-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .gobj-item.done .gobj-item-text {
      text-decoration: line-through;
      color: var(--lumiverse-text-dim, #666);
    }

    .gobj-remove-btn {
      flex-shrink: 0;
      width: 18px; height: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      background: none; border: none;
      color: var(--lumiverse-text-dim, #777);
      cursor: pointer;
      border-radius: 3px;
      transition: color 0.1s, background 0.1s;
    }
    .gobj-remove-btn:hover { color: #f87171; background: rgba(248,113,113,0.12); }

    .gobj-empty {
      font-size: 12px;
      color: var(--lumiverse-text-dim, #666);
      font-style: italic;
      padding: 2px;
    }

    .gobj-lock-badge {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #f87171;
      background: rgba(248,113,113,0.10);
      border: 1px solid rgba(248,113,113,0.25);
      border-radius: 4px;
      padding: 1px 5px;
    }
    .gobj-lock-badge.hidden { display: none; }

    .gobj-divider { height: 1px; background: var(--lumiverse-border, #2e2e2e); }

    /* ── Member selector ── */
    .gobj-member-wrap { display: flex; flex-direction: column; gap: 8px; }

    .gobj-select {
      width: 100%;
      padding: 7px 10px;
      font-size: 13px;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #333);
      border-radius: var(--lumiverse-radius, 6px);
      color: var(--lumiverse-text, #eee);
      outline: none;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .gobj-select:focus { border-color: var(--lumiverse-accent, #7c6ff7); }
    .gobj-select.placeholder { color: var(--lumiverse-text-dim, #666); }

    /* ── Spinner ── */
    .gobj-spinner-wrap { display: flex; flex-direction: column; gap: 6px; }

    .gobj-spinner-label {
      font-size: 12px;
      color: var(--lumiverse-text-dim, #888);
      line-height: 1.4;
    }
    .gobj-spinner-label span { color: var(--lumiverse-accent, #7c6ff7); font-weight: 600; }

    .gobj-spinner-row { display: flex; align-items: center; gap: 6px; }

    .gobj-arrow-col {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--lumiverse-border, #333);
      border-radius: var(--lumiverse-radius, 6px);
      overflow: hidden;
      flex-shrink: 0;
    }
    .gobj-arrow {
      width: 26px; height: 19px;
      display: flex; align-items: center; justify-content: center;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: none;
      color: var(--lumiverse-text-dim, #888);
      cursor: pointer;
      font-size: 9px;
      transition: background 0.1s, color 0.1s;
    }
    .gobj-arrow:hover {
      background: color-mix(in srgb, var(--lumiverse-accent, #7c6ff7) 20%, transparent);
      color: var(--lumiverse-text, #eee);
    }
    .gobj-arrow:first-child { border-bottom: 1px solid var(--lumiverse-border, #333); }

    .gobj-spinner-box {
      flex: 1;
      display: flex;
      align-items: center;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #333);
      border-radius: var(--lumiverse-radius, 6px);
      overflow: hidden;
    }
    .gobj-spinner-num {
      flex: 1;
      padding: 7px 10px;
      font-size: 13px;
      background: none; border: none;
      color: var(--lumiverse-text, #eee);
      outline: none;
      text-align: center;
      -moz-appearance: textfield;
      appearance: textfield;
      min-width: 0;
    }
    .gobj-spinner-num::-webkit-inner-spin-button,
    .gobj-spinner-num::-webkit-outer-spin-button { display: none !important; }

    .gobj-disabled-tag {
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--lumiverse-text-dim, #555);
      padding: 0 10px 0 0;
      white-space: nowrap;
      transition: opacity 0.2s;
    }

    /* ── Thinking box ── */
    .gobj-thinking-wrap { display: flex; flex-direction: column; gap: 8px; }

    .gobj-thinking-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .gobj-thinking-status {
      font-size: 11px;
      color: var(--lumiverse-text-dim, #555);
      font-style: italic;
    }
    .gobj-thinking-status.thinking { color: var(--lumiverse-accent, #7c6ff7); }
    .gobj-thinking-status.error    { color: #f87171; }

    .gobj-thinking-box {
      min-height: 90px;
      padding: 10px 12px;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #2e2e2e);
      border-radius: var(--lumiverse-radius, 6px);
      color: var(--lumiverse-text-dim, #555);
      font-size: 13px;
      font-style: italic;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
      transition: border-color 0.3s, color 0.2s;
    }
    .gobj-thinking-box.has-content {
      color: var(--lumiverse-text, #eee);
      font-style: normal;
      border-color: color-mix(in srgb, var(--lumiverse-accent, #7c6ff7) 30%, var(--lumiverse-border, #2e2e2e));
    }
  `;
  tab.root.appendChild(style);
  const root = document.createElement("div");
  root.className = "gobj-root";
  tab.root.appendChild(root);
  const goals = [];
  const objectives = [];
  let goalInterval = 0;
  let objectiveInterval = 0;
  let selectedMemberId = "";
  let goalLockBadge = null;
  let thinkingBoxEl = null;
  let thinkingStatusEl = null;
  function emitState() {
    const state = {
      goals: goals.map((i) => ({ ...i })),
      objectives: objectives.map((i) => ({ ...i })),
      goalInterval,
      objectiveInterval,
      selectedMemberId
    };
    ctx.sendToBackend({ type: "gobj_state", state });
  }
  function updateGoalLock() {
    if (!goalLockBadge)
      return;
    const locked = objectives.length > 0 && !objectives.every((o) => o.done);
    goalLockBadge.classList.toggle("hidden", !locked);
  }
  function buildListSection(labelText, placeholder, items, extraLabel) {
    const section = document.createElement("div");
    section.className = "gobj-section";
    const labelRow = document.createElement("div");
    labelRow.className = "gobj-label";
    labelRow.textContent = labelText;
    if (extraLabel)
      labelRow.appendChild(extraLabel());
    const row = document.createElement("div");
    row.className = "gobj-input-row";
    const input = document.createElement("input");
    input.className = "gobj-input";
    input.type = "text";
    input.placeholder = placeholder;
    const addBtn = document.createElement("button");
    addBtn.className = "gobj-add-btn";
    addBtn.textContent = "+";
    row.appendChild(input);
    row.appendChild(addBtn);
    const list = document.createElement("div");
    list.className = "gobj-list";
    const emptyEl = document.createElement("div");
    emptyEl.className = "gobj-empty";
    emptyEl.textContent = "None added yet.";
    function render() {
      list.innerHTML = "";
      if (items.length === 0) {
        list.appendChild(emptyEl);
        return;
      }
      items.forEach((item, i) => {
        const el = document.createElement("div");
        el.className = "gobj-item" + (item.done ? " done" : "");
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.className = "gobj-check";
        chk.checked = item.done;
        chk.addEventListener("change", () => {
          item.done = chk.checked;
          el.classList.toggle("done", item.done);
          updateGoalLock();
          emitState();
        });
        const span = document.createElement("span");
        span.className = "gobj-item-text";
        span.textContent = item.text;
        span.title = item.text;
        const rm = document.createElement("button");
        rm.className = "gobj-remove-btn";
        rm.textContent = "×";
        rm.addEventListener("click", () => {
          items.splice(i, 1);
          render();
          updateGoalLock();
          emitState();
        });
        el.appendChild(chk);
        el.appendChild(span);
        el.appendChild(rm);
        list.appendChild(el);
      });
    }
    function add() {
      const v = input.value.trim();
      if (!v)
        return;
      items.push({ text: v, done: false });
      input.value = "";
      render();
      updateGoalLock();
      emitState();
    }
    addBtn.addEventListener("click", add);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        add();
    });
    section.appendChild(labelRow);
    section.appendChild(row);
    section.appendChild(list);
    render();
    return section;
  }
  function buildSpinner(labelFn, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "gobj-spinner-wrap";
    const labelEl = document.createElement("div");
    labelEl.className = "gobj-spinner-label";
    const spinRow = document.createElement("div");
    spinRow.className = "gobj-spinner-row";
    const arrowCol = document.createElement("div");
    arrowCol.className = "gobj-arrow-col";
    const upBtn = document.createElement("button");
    upBtn.className = "gobj-arrow";
    upBtn.textContent = "▲";
    const downBtn = document.createElement("button");
    downBtn.className = "gobj-arrow";
    downBtn.textContent = "▼";
    arrowCol.appendChild(upBtn);
    arrowCol.appendChild(downBtn);
    const box = document.createElement("div");
    box.className = "gobj-spinner-box";
    const numInput = document.createElement("input");
    numInput.className = "gobj-spinner-num";
    numInput.type = "number";
    numInput.value = "0";
    numInput.min = "0";
    const disabledTag = document.createElement("span");
    disabledTag.className = "gobj-disabled-tag";
    disabledTag.textContent = "Disabled";
    box.appendChild(numInput);
    box.appendChild(disabledTag);
    spinRow.appendChild(arrowCol);
    spinRow.appendChild(box);
    function update() {
      let v = parseInt(numInput.value) || 0;
      if (v < 0)
        v = 0;
      numInput.value = String(v);
      disabledTag.style.opacity = v === 0 ? "1" : "0";
      labelEl.innerHTML = labelFn(v);
      onChange(v);
      emitState();
    }
    upBtn.addEventListener("click", () => {
      numInput.value = String((parseInt(numInput.value) || 0) + 1);
      update();
    });
    downBtn.addEventListener("click", () => {
      numInput.value = String(Math.max(0, (parseInt(numInput.value) || 0) - 1));
      update();
    });
    numInput.addEventListener("input", update);
    update();
    wrap.appendChild(labelEl);
    wrap.appendChild(spinRow);
    return wrap;
  }
  function buildMemberSelector() {
    const wrap = document.createElement("div");
    wrap.className = "gobj-member-wrap";
    const label = document.createElement("div");
    label.className = "gobj-label";
    label.textContent = "Council Member";
    const select = document.createElement("select");
    select.className = "gobj-select placeholder";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Loading characters…";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);
    select.addEventListener("change", () => {
      selectedMemberId = select.value;
      select.classList.toggle("placeholder", !selectedMemberId);
      emitState();
    });
    ctx.sendToBackend({ type: "get_members" });
    wrap.appendChild(label);
    wrap.appendChild(select);
    wrap._select = select;
    wrap._placeholder = placeholder;
    return wrap;
  }
  function buildThinkingBox() {
    const wrap = document.createElement("div");
    wrap.className = "gobj-thinking-wrap";
    const header = document.createElement("div");
    header.className = "gobj-thinking-header";
    const label = document.createElement("div");
    label.className = "gobj-label";
    label.textContent = "Director";
    const statusEl = document.createElement("span");
    statusEl.className = "gobj-thinking-status";
    statusEl.textContent = "idle";
    thinkingStatusEl = statusEl;
    header.appendChild(label);
    header.appendChild(statusEl);
    const box = document.createElement("div");
    box.className = "gobj-thinking-box";
    box.textContent = "Output will appear here after the first trigger…";
    thinkingBoxEl = box;
    wrap.appendChild(header);
    wrap.appendChild(box);
    return wrap;
  }
  let memberSelectEl = null;
  let memberPlaceholderEl = null;
  const unsubBackend = ctx.onBackendMessage((payload) => {
    switch (payload.type) {
      case "members": {
        if (!memberSelectEl || !memberPlaceholderEl)
          return;
        const members = payload.members ?? [];
        memberPlaceholderEl.textContent = members.length ? "Select a character…" : "No characters found";
        members.forEach((m) => {
          const opt = document.createElement("option");
          opt.value = m.id;
          opt.textContent = m.name;
          memberSelectEl.appendChild(opt);
        });
        break;
      }
      case "gobj_thinking": {
        if (!thinkingBoxEl || !thinkingStatusEl)
          return;
        switch (payload.status) {
          case "thinking":
            thinkingBoxEl.textContent = "Analyzing…";
            thinkingBoxEl.className = "gobj-thinking-box";
            thinkingStatusEl.textContent = "thinking";
            thinkingStatusEl.className = "gobj-thinking-status thinking";
            break;
          case "done":
            thinkingBoxEl.textContent = payload.text ?? "";
            thinkingBoxEl.className = "gobj-thinking-box" + (payload.text ? " has-content" : "");
            thinkingStatusEl.textContent = "done";
            thinkingStatusEl.className = "gobj-thinking-status";
            break;
          case "error":
            thinkingBoxEl.textContent = payload.text ?? "Error.";
            thinkingBoxEl.className = "gobj-thinking-box";
            thinkingStatusEl.textContent = "error";
            thinkingStatusEl.className = "gobj-thinking-status error";
            break;
        }
        break;
      }
    }
  });
  const div = (cls) => Object.assign(document.createElement("div"), { className: cls });
  const memberWrap = buildMemberSelector();
  memberSelectEl = memberWrap._select;
  memberPlaceholderEl = memberWrap._placeholder;
  root.appendChild(memberWrap);
  root.appendChild(div("gobj-divider"));
  const lockBadge = document.createElement("span");
  lockBadge.className = "gobj-lock-badge hidden";
  lockBadge.title = "All objectives must be completed first";
  lockBadge.textContent = "\uD83D\uDD12 locked";
  goalLockBadge = lockBadge;
  root.appendChild(buildListSection("Goals", "Add a goal…", goals, () => lockBadge));
  root.appendChild(div("gobj-divider"));
  root.appendChild(buildListSection("Objectives", "Add an objective…", objectives));
  root.appendChild(div("gobj-divider"));
  root.appendChild(buildSpinner((n) => n === 0 ? "Injecting <span>Goals</span> — Disabled" : `Injecting <span>Goals</span> every <span>${n}</span> call${n === 1 ? "" : "s"}`, (n) => {
    goalInterval = n;
  }));
  root.appendChild(buildSpinner((n) => n === 0 ? "Injecting <span>Objectives</span> — Disabled" : `Injecting <span>Objectives</span> every <span>${n}</span> call${n === 1 ? "" : "s"}`, (n) => {
    objectiveInterval = n;
  }));
  root.appendChild(div("gobj-divider"));
  root.appendChild(buildThinkingBox());
  return () => {
    unsubBackend();
    tab.destroy();
  };
}
export {
  setup
};
