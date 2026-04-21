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
      gap: 16px;
      padding: 14px 12px;
      height: 100%;
      overflow-y: auto;
      box-sizing: border-box;
      font-family: inherit;
    }

    .gobj-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .gobj-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--lumiverse-text-dim, #888);
    }

    .gobj-input-row {
      display: flex;
      gap: 6px;
    }

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
    .gobj-input:focus {
      border-color: var(--lumiverse-accent, #7c6ff7);
    }
    .gobj-input::placeholder {
      color: var(--lumiverse-text-dim, #666);
    }

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
    .gobj-add-btn:active { opacity: 0.7; }

    .gobj-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-height: 160px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .gobj-list::-webkit-scrollbar { width: 4px; }
    .gobj-list::-webkit-scrollbar-thumb {
      background: var(--lumiverse-border, #444);
      border-radius: 2px;
    }

    .gobj-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 7px 10px;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #2e2e2e);
      border-radius: var(--lumiverse-radius, 6px);
      font-size: 13px;
      color: var(--lumiverse-text, #eee);
      animation: gobj-slide-in 0.15s ease;
    }

    @keyframes gobj-slide-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .gobj-item-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gobj-remove-btn {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      line-height: 1;
      background: none;
      border: none;
      color: var(--lumiverse-text-dim, #777);
      cursor: pointer;
      border-radius: 3px;
      transition: color 0.1s, background 0.1s;
    }
    .gobj-remove-btn:hover {
      color: #f87171;
      background: rgba(248,113,113,0.12);
    }

    .gobj-empty {
      font-size: 12px;
      color: var(--lumiverse-text-dim, #666);
      font-style: italic;
      padding: 4px 2px;
    }

    /* ── Council button ─────────────────────────────── */
    .gobj-council-btn {
      width: 100%;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 600;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #333);
      border-radius: var(--lumiverse-radius, 6px);
      color: var(--lumiverse-text-dim, #888);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .gobj-council-btn .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--lumiverse-text-dim, #555);
      transition: background 0.2s, box-shadow 0.2s;
    }
    .gobj-council-btn.active {
      border-color: var(--lumiverse-accent, #7c6ff7);
      color: var(--lumiverse-text, #eee);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--lumiverse-accent, #7c6ff7) 25%, transparent);
    }
    .gobj-council-btn.active .dot {
      background: var(--lumiverse-accent, #7c6ff7);
      box-shadow: 0 0 8px 2px color-mix(in srgb, var(--lumiverse-accent, #7c6ff7) 70%, transparent);
    }
    .gobj-council-btn:hover {
      border-color: color-mix(in srgb, var(--lumiverse-accent, #7c6ff7) 50%, var(--lumiverse-border, #333));
    }

    /* ── Divider ──────────────────────────────────────── */
    .gobj-divider {
      height: 1px;
      background: var(--lumiverse-border, #2e2e2e);
      margin: 2px 0;
    }

    /* ── Spinner (number box) ─────────────────────────── */
    .gobj-spinner-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .gobj-spinner-label {
      font-size: 12px;
      color: var(--lumiverse-text-dim, #888);
      line-height: 1.4;
    }

    .gobj-spinner {
      display: flex;
      align-items: center;
      gap: 0;
      border: 1px solid var(--lumiverse-border, #333);
      border-radius: var(--lumiverse-radius, 6px);
      overflow: hidden;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
    }

    .gobj-spinner-num {
      flex: 1;
      padding: 7px 10px;
      font-size: 13px;
      background: none;
      border: none;
      color: var(--lumiverse-text, #eee);
      outline: none;
      text-align: center;
      min-width: 0;
    }
    .gobj-spinner-num::-webkit-inner-spin-button,
    .gobj-spinner-num::-webkit-outer-spin-button { -webkit-appearance: none; }

    .gobj-spinner-disabled {
      font-size: 11px;
      color: var(--lumiverse-accent, #7c6ff7);
      padding: 0 8px 0 0;
      white-space: nowrap;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .gobj-arrow-col {
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--lumiverse-border, #333);
    }

    .gobj-arrow {
      width: 28px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      color: var(--lumiverse-text-dim, #888);
      cursor: pointer;
      font-size: 10px;
      transition: background 0.1s, color 0.1s;
    }
    .gobj-arrow:hover {
      background: color-mix(in srgb, var(--lumiverse-accent, #7c6ff7) 15%, transparent);
      color: var(--lumiverse-text, #eee);
    }
    .gobj-arrow:first-child {
      border-bottom: 1px solid var(--lumiverse-border, #333);
    }
  `;
  tab.root.appendChild(style);
  const root = document.createElement("div");
  root.className = "gobj-root";
  tab.root.appendChild(root);
  function buildListSection(labelText, placeholder) {
    const section = document.createElement("div");
    section.className = "gobj-section";
    const label = document.createElement("div");
    label.className = "gobj-label";
    label.textContent = labelText;
    const inputRow = document.createElement("div");
    inputRow.className = "gobj-input-row";
    const input = document.createElement("input");
    input.className = "gobj-input";
    input.type = "text";
    input.placeholder = placeholder;
    const addBtn = document.createElement("button");
    addBtn.className = "gobj-add-btn";
    addBtn.textContent = "+";
    inputRow.appendChild(input);
    inputRow.appendChild(addBtn);
    const list = document.createElement("div");
    list.className = "gobj-list";
    const empty = document.createElement("div");
    empty.className = "gobj-empty";
    empty.textContent = "None added yet.";
    list.appendChild(empty);
    const items = [];
    function renderList() {
      list.innerHTML = "";
      if (items.length === 0) {
        list.appendChild(empty);
        return;
      }
      items.forEach((text, i) => {
        const item = document.createElement("div");
        item.className = "gobj-item";
        const span = document.createElement("span");
        span.className = "gobj-item-text";
        span.textContent = text;
        span.title = text;
        const removeBtn = document.createElement("button");
        removeBtn.className = "gobj-remove-btn";
        removeBtn.textContent = "×";
        removeBtn.title = "Remove";
        removeBtn.addEventListener("click", () => {
          items.splice(i, 1);
          renderList();
        });
        item.appendChild(span);
        item.appendChild(removeBtn);
        list.appendChild(item);
      });
    }
    function addItem() {
      const val = input.value.trim();
      if (!val)
        return;
      items.push(val);
      input.value = "";
      renderList();
    }
    addBtn.addEventListener("click", addItem);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        addItem();
    });
    section.appendChild(label);
    section.appendChild(inputRow);
    section.appendChild(list);
    return section;
  }
  function buildSpinner(labelText) {
    const wrap = document.createElement("div");
    wrap.className = "gobj-spinner-wrap";
    const label = document.createElement("div");
    label.className = "gobj-spinner-label";
    label.textContent = labelText;
    const spinnerRow = document.createElement("div");
    spinnerRow.className = "gobj-spinner";
    const numInput = document.createElement("input");
    numInput.className = "gobj-spinner-num";
    numInput.type = "number";
    numInput.min = "0";
    numInput.value = "0";
    const disabledTag = document.createElement("span");
    disabledTag.className = "gobj-spinner-disabled";
    disabledTag.textContent = "Disabled";
    const arrowCol = document.createElement("div");
    arrowCol.className = "gobj-arrow-col";
    const upBtn = document.createElement("button");
    upBtn.className = "gobj-arrow";
    upBtn.textContent = "▲";
    upBtn.title = "Increase";
    const downBtn = document.createElement("button");
    downBtn.className = "gobj-arrow";
    downBtn.textContent = "▼";
    downBtn.title = "Decrease";
    function update() {
      const v = parseInt(numInput.value) || 0;
      numInput.value = String(Math.max(0, v));
      disabledTag.style.display = numInput.value === "0" ? "" : "none";
    }
    upBtn.addEventListener("click", () => {
      numInput.value = String((parseInt(numInput.value) || 0) + 1);
      update();
    });
    downBtn.addEventListener("click", () => {
      numInput.value = String((parseInt(numInput.value) || 0) - 1);
      update();
    });
    numInput.addEventListener("input", update);
    arrowCol.appendChild(upBtn);
    arrowCol.appendChild(downBtn);
    spinnerRow.appendChild(numInput);
    spinnerRow.appendChild(disabledTag);
    spinnerRow.appendChild(arrowCol);
    wrap.appendChild(label);
    wrap.appendChild(spinnerRow);
    return wrap;
  }
  function buildCouncilButton() {
    const section = document.createElement("div");
    section.className = "gobj-section";
    const label = document.createElement("div");
    label.className = "gobj-label";
    label.textContent = "Council";
    const btn = document.createElement("button");
    btn.className = "gobj-council-btn";
    const dot = document.createElement("span");
    dot.className = "dot";
    const btnText = document.createElement("span");
    btnText.textContent = "Council Inactive";
    btn.appendChild(dot);
    btn.appendChild(btnText);
    let active = false;
    btn.addEventListener("click", () => {
      active = !active;
      btn.classList.toggle("active", active);
      btnText.textContent = active ? "Council Active" : "Council Inactive";
    });
    section.appendChild(label);
    section.appendChild(btn);
    return section;
  }
  root.appendChild(buildListSection("Goals", "Add a goal..."));
  const div1 = document.createElement("div");
  div1.className = "gobj-divider";
  root.appendChild(div1);
  root.appendChild(buildListSection("Objectives", "Add an objective..."));
  const div2 = document.createElement("div");
  div2.className = "gobj-divider";
  root.appendChild(div2);
  root.appendChild(buildCouncilButton());
  const div3 = document.createElement("div");
  div3.className = "gobj-divider";
  root.appendChild(div3);
  root.appendChild(buildSpinner("Injecting Goal Every x Calls"));
  root.appendChild(buildSpinner("Injecting Objectives Every x Calls"));
  return () => {
    tab.destroy();
  };
}
export {
  setup
};
