import type { SpindleFrontendContext } from 'lumiverse-spindle-types'

export function setup(ctx: SpindleFrontendContext) {

  // ── Register drawer tab ────────────────────────────────────────────────────
  const tab = ctx.ui.registerDrawerTab({
    id: 'goals-tab',
    title: 'Goals & Objectives',
    shortName: 'Goals',
    description: 'Manage goals and objectives for LLM injection',
    keywords: ['goals', 'objectives', 'inject', 'council'],
    headerTitle: 'Goals & Objectives',
    iconSvg: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="10" cy="10" r="1" fill="currentColor"/>
    </svg>`,
  })

  // ── Styles ─────────────────────────────────────────────────────────────────
  const style = document.createElement('style')
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

    .gobj-gated {
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: opacity 0.3s;
    }
    .gobj-gated.inactive {
      opacity: 0.35;
      pointer-events: none;
    }

    .gobj-section { display: flex; flex-direction: column; gap: 8px; }

    .gobj-label {
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
      max-height: 150px;
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
      justify-content: space-between;
      gap: 8px;
      padding: 7px 10px;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #2e2e2e);
      border-radius: var(--lumiverse-radius, 6px);
      font-size: 13px;
      color: var(--lumiverse-text, #eee);
      animation: gobj-in 0.15s ease;
    }
    @keyframes gobj-in {
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

    .gobj-divider { height: 1px; background: var(--lumiverse-border, #2e2e2e); }

    /* ── Spinner ── */
    .gobj-spinner-wrap { display: flex; flex-direction: column; gap: 6px; }

    .gobj-spinner-label {
      font-size: 12px;
      color: var(--lumiverse-text-dim, #888);
      line-height: 1.4;
    }
    .gobj-spinner-label span {
      color: var(--lumiverse-accent, #7c6ff7);
      font-weight: 600;
    }

    .gobj-spinner-row { display: flex; align-items: center; gap: 6px; }

    /* Arrows outside, LEFT of the input box */
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

    /* Kill ALL native number arrows */
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

    .gobj-select {
      padding: 5px 8px;
      font-size: 12px;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #333);
      border-radius: var(--lumiverse-radius, 6px);
      color: var(--lumiverse-text, #eee);
      outline: none;
      cursor: pointer;
      max-width: 160px;
      transition: border-color 0.15s;
    }
    .gobj-select:focus { border-color: var(--lumiverse-accent, #7c6ff7); }

    .gobj-thinking-box {
      min-height: 140px;
      padding: 10px 12px;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #2e2e2e);
      border-radius: var(--lumiverse-radius, 6px);
      color: var(--lumiverse-text-dim, #555);
      font-size: 13px;
      font-style: italic;
      user-select: none;
      cursor: default;
    }

    /* ── Council status banner ── */
    .gobj-council-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: var(--lumiverse-fill-subtle, #1a1a1a);
      border: 1px solid var(--lumiverse-border, #2e2e2e);
      border-radius: var(--lumiverse-radius, 6px);
      font-size: 12px;
      color: var(--lumiverse-text-dim, #777);
      transition: border-color 0.3s, color 0.3s;
    }
    .gobj-council-status .dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--lumiverse-text-dim, #444);
      flex-shrink: 0;
      transition: background 0.3s, box-shadow 0.3s;
    }
    .gobj-council-status.active {
      color: var(--lumiverse-text, #ddd);
      border-color: color-mix(in srgb, var(--lumiverse-accent, #7c6ff7) 50%, var(--lumiverse-border, #333));
    }
    .gobj-council-status.active .dot {
      background: var(--lumiverse-accent, #7c6ff7);
      box-shadow: 0 0 7px 2px color-mix(in srgb, var(--lumiverse-accent, #7c6ff7) 55%, transparent);
    }
  `
  tab.root.appendChild(style)

  // ── Root ───────────────────────────────────────────────────────────────────
  const root = document.createElement('div')
  root.className = 'gobj-root'
  tab.root.appendChild(root)

  // ── Council status banner (top, always visible) ────────────────────────────
  const banner = document.createElement('div')
  banner.className = 'gobj-council-status'
  const dot = document.createElement('span'); dot.className = 'dot'
  const bannerText = document.createElement('span'); bannerText.textContent = 'Sidecar LLM Inactive'
  banner.appendChild(dot)
  banner.appendChild(bannerText)
  root.appendChild(banner)

  // Gated section — greyed when council inactive
  const gated = document.createElement('div')
  gated.className = 'gobj-gated inactive'
  root.appendChild(gated)

  function setCouncil(active: boolean) {
    banner.classList.toggle('active', active)
    bannerText.textContent = active ? 'Sidecar LLM Active' : 'Sidecar LLM Inactive'
    gated.classList.toggle('inactive', !active)
  }

  // ── Sidecar LLM status ─────────────────────────────────────────────────────
  // Active when sidecarSettings.connectionProfileId is set
  ctx.events.on('SETTINGS_UPDATED', (payload: any) => {
    if (payload?.key === 'sidecarSettings') {
      setCouncil(!!payload.value?.connectionProfileId)
    }
  })

  function fetchCouncilStatus() {
    fetch('/api/v1/settings')
      .then(r => r.json())
      .then((settings: any) => {
        setCouncil(!!settings?.sidecarSettings?.connectionProfileId)
      })
      .catch(() => { /* leave inactive */ })
  }
  fetchCouncilStatus()

  // ── List section ───────────────────────────────────────────────────────────
  function buildListSection(labelText: string, placeholder: string): HTMLElement {
    const section = document.createElement('div')
    section.className = 'gobj-section'

    const label = document.createElement('div')
    label.className = 'gobj-label'
    label.textContent = labelText

    const row = document.createElement('div')
    row.className = 'gobj-input-row'

    const input = document.createElement('input')
    input.className = 'gobj-input'
    input.type = 'text'
    input.placeholder = placeholder

    const addBtn = document.createElement('button')
    addBtn.className = 'gobj-add-btn'
    addBtn.textContent = '+'

    row.appendChild(input)
    row.appendChild(addBtn)

    const list = document.createElement('div')
    list.className = 'gobj-list'

    const emptyEl = document.createElement('div')
    emptyEl.className = 'gobj-empty'
    emptyEl.textContent = 'None added yet.'
    list.appendChild(emptyEl)

    const items: string[] = []

    function render() {
      list.innerHTML = ''
      if (items.length === 0) { list.appendChild(emptyEl); return }
      items.forEach((text, i) => {
        const item = document.createElement('div')
        item.className = 'gobj-item'
        const span = document.createElement('span')
        span.className = 'gobj-item-text'
        span.textContent = text; span.title = text
        const rm = document.createElement('button')
        rm.className = 'gobj-remove-btn'; rm.textContent = '×'
        rm.addEventListener('click', () => { items.splice(i, 1); render() })
        item.appendChild(span); item.appendChild(rm)
        list.appendChild(item)
      })
    }

    function add() {
      const v = input.value.trim(); if (!v) return
      items.push(v); input.value = ''; render()
    }

    addBtn.addEventListener('click', add)
    input.addEventListener('keydown', e => { if (e.key === 'Enter') add() })
    section.appendChild(label); section.appendChild(row); section.appendChild(list)
    return section
  }

  // ── Spinner ────────────────────────────────────────────────────────────────
  function buildSpinner(labelFn: (n: number) => string): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'gobj-spinner-wrap'

    const labelEl = document.createElement('div')
    labelEl.className = 'gobj-spinner-label'

    const spinRow = document.createElement('div')
    spinRow.className = 'gobj-spinner-row'

    // Arrows — outside, left
    const arrowCol = document.createElement('div')
    arrowCol.className = 'gobj-arrow-col'
    const upBtn = document.createElement('button')
    upBtn.className = 'gobj-arrow'; upBtn.textContent = '▲'
    const downBtn = document.createElement('button')
    downBtn.className = 'gobj-arrow'; downBtn.textContent = '▼'
    arrowCol.appendChild(upBtn); arrowCol.appendChild(downBtn)

    // Input box
    const box = document.createElement('div')
    box.className = 'gobj-spinner-box'
    const numInput = document.createElement('input')
    numInput.className = 'gobj-spinner-num'
    numInput.type = 'number'; numInput.value = '0'; numInput.min = '0'
    const disabledTag = document.createElement('span')
    disabledTag.className = 'gobj-disabled-tag'; disabledTag.textContent = 'Disabled'
    box.appendChild(numInput); box.appendChild(disabledTag)

    spinRow.appendChild(arrowCol); spinRow.appendChild(box)

    function update() {
      let v = parseInt(numInput.value) || 0
      if (v < 0) v = 0
      numInput.value = String(v)
      disabledTag.style.opacity = v === 0 ? '1' : '0'
      labelEl.innerHTML = labelFn(v)
    }

    upBtn.addEventListener('click', () => { numInput.value = String((parseInt(numInput.value) || 0) + 1); update() })
    downBtn.addEventListener('click', () => { numInput.value = String((parseInt(numInput.value) || 0) - 1); update() })
    numInput.addEventListener('input', update)
    update()

    wrap.appendChild(labelEl); wrap.appendChild(spinRow)
    return wrap
  }

  // ── Thinking box ───────────────────────────────────────────────────────────
  function buildThinkingBox(): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'gobj-thinking-wrap'

    const header = document.createElement('div')
    header.className = 'gobj-thinking-header'

    const label = document.createElement('div')
    label.className = 'gobj-label'; label.textContent = 'Thinking'

    const select = document.createElement('select')
    select.className = 'gobj-select'

    // TODO: populate with real council members from backend when implemented
    const members = ['Select member...', 'Member 1', 'Member 2', 'Member 3']
    members.forEach((name, i) => {
      const opt = document.createElement('option')
      opt.value = i === 0 ? '' : String(i)
      opt.textContent = name
      if (i === 0) { opt.disabled = true; opt.selected = true }
      select.appendChild(opt)
    })

    header.appendChild(label); header.appendChild(select)

    const box = document.createElement('div')
    box.className = 'gobj-thinking-box'
    box.textContent = 'Thinking output will appear here...'

    wrap.appendChild(header); wrap.appendChild(box)
    return wrap
  }

  // ── Assemble ───────────────────────────────────────────────────────────────
  gated.appendChild(buildListSection('Goals', 'Add a goal...'))

  const d1 = document.createElement('div'); d1.className = 'gobj-divider'; gated.appendChild(d1)

  gated.appendChild(buildListSection('Objectives', 'Add an objective...'))

  const d2 = document.createElement('div'); d2.className = 'gobj-divider'; gated.appendChild(d2)

  gated.appendChild(
    buildSpinner(n => n === 0
      ? 'Injecting <span>Goals</span> — Disabled'
      : `Injecting <span>Goals</span> every <span>${n}</span> call${n === 1 ? '' : 's'}`)
  )
  gated.appendChild(
    buildSpinner(n => n === 0
      ? 'Injecting <span>Objectives</span> — Disabled'
      : `Injecting <span>Objectives</span> every <span>${n}</span> call${n === 1 ? '' : 's'}`)
  )

  const d3 = document.createElement('div'); d3.className = 'gobj-divider'; gated.appendChild(d3)

  gated.appendChild(buildThinkingBox())

  return () => { tab.destroy() }
}