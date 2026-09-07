// NOTE: the `lumiverse-spindle-types` package published on npm at the time of
// writing (0.1.9) lags behind the current Spindle docs — it's missing
// `permissions.has()` / `permissions.onChanged()`, the 2-arg
// `sendToFrontend(payload, userId)` overload, and a few other additions this
// extension relies on. The methods used below match the documented runtime
// API (docs.lumiverse.chat); `spindle` is typed as `any` here so the build
// doesn't fight a stale .d.ts. Swap back to the typed import once an updated
// package version is published.
declare const spindle: any

import {
  GoalState,
  Goal,
  defaultState,
  FrontendRequest,
  PermissionSnapshot,
} from './types'

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function storageKey(chatId: string): string {
  return `goals/${chatId}.json`
}

async function loadState(chatId: string): Promise<GoalState> {
  const state: GoalState = await spindle.storage.getJson(storageKey(chatId), {
    fallback: defaultState(chatId),
  })
  // Backfill fields for states written by older versions of the extension.
  if (!state.long) state.long = { text: '', source: '', updatedAt: 0 }
  if (!state.short) state.short = { text: '', source: '', updatedAt: 0 }
  if (!state.longEvery || state.longEvery < 1) state.longEvery = 10
  if (!state.shortEvery || state.shortEvery < 1) state.shortEvery = 3
  if (!state.userMessageCount || state.userMessageCount < 0) state.userMessageCount = 0
  return state
}

async function saveState(state: GoalState): Promise<void> {
  await spindle.storage.setJson(storageKey(state.chatId), state, { indent: 2 })
}

function permissionSnapshot(): PermissionSnapshot {
  return {
    generation: spindle.permissions.has('generation'),
    chats: spindle.permissions.has('chats'),
    chat_mutation: spindle.permissions.has('chat_mutation'),
    characters: spindle.permissions.has('characters'),
  }
}

async function pushState(chatId: string | null, state: GoalState | null, userId?: string) {
  spindle.sendToFrontend(
    { type: 'state', chatId, state, permissions: permissionSnapshot() },
    userId,
  )
}

// ---------------------------------------------------------------------------
// Context gathering for AI goal generation
// ---------------------------------------------------------------------------

interface ChatContext {
  characterName: string
  characterBlock: string
  historyBlock: string
}

async function gatherContext(chatId: string): Promise<ChatContext> {
  let characterName = 'the character'
  let characterBlock = ''
  let historyBlock = ''

  if (spindle.permissions.has('chats')) {
    try {
      const chat = await spindle.chats.get(chatId)
      if (chat && spindle.permissions.has('characters')) {
        const char = await spindle.characters.get(chat.character_id)
        if (char) {
          characterName = char.name || characterName
          const parts = [
            char.description ? `Description: ${char.description}` : '',
            char.personality ? `Personality: ${char.personality}` : '',
            char.scenario ? `Scenario: ${char.scenario}` : '',
          ].filter(Boolean)
          characterBlock = parts.join('\n')
        }
      }
    } catch (err: any) {
      spindle.log.warn(`Goalify: failed to load chat/character context: ${err?.message ?? err}`)
    }
  }

  if (spindle.permissions.has('chat_mutation')) {
    try {
      const messages = await spindle.chat.getMessages(chatId)
      const recent = messages.slice(-16)
      historyBlock = recent
        .map((m: any) => `${m.role === 'user' ? 'User' : m.role === 'assistant' ? characterName : 'System'}: ${m.content}`)
        .join('\n')
    } catch (err: any) {
      spindle.log.warn(`Goalify: failed to load chat history: ${err?.message ?? err}`)
    }
  }

  return { characterName, characterBlock, historyBlock }
}

// ---------------------------------------------------------------------------
// AI generation
// ---------------------------------------------------------------------------

async function generateLongTermGoal(chatId: string): Promise<string | null> {
  if (!spindle.permissions.has('generation')) {
    spindle.toast.warning('Goalify: enable the "Generation" permission to auto-generate goals.')
    return null
  }

  const ctx = await gatherContext(chatId)

  const system = [
    'You are a narrative-design assistant helping track the arc of an ongoing roleplay chat.',
    'Write ONE long-term goal: the big-picture narrative throughline for the story, on the scale of an entire series arc.',
    'Think in terms of a theme like "Redemption of X" or "Y earns their family\'s trust back" — not a single scene, not a checklist.',
    'Respond with ONLY the goal itself as a single sentence. No preamble, no quotes, no labels.',
  ].join('\n')

  const user = [
    ctx.characterBlock ? `Character (${ctx.characterName}):\n${ctx.characterBlock}` : '',
    ctx.historyBlock ? `Recent conversation:\n${ctx.historyBlock}` : 'The conversation has just begun.',
    'What is the long-term narrative goal for this story?',
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const result = await spindle.generate.quiet({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      parameters: { temperature: 0.8, max_tokens: 120 },
    })
    return cleanGoalText(result.content)
  } catch (err: any) {
    spindle.log.error(`Goalify: long-term goal generation failed: ${err?.message ?? err}`)
    return null
  }
}

async function generateShortTermGoal(chatId: string, longGoal: string): Promise<string | null> {
  if (!spindle.permissions.has('generation')) {
    spindle.toast.warning('Goalify: enable the "Generation" permission to auto-generate goals.')
    return null
  }

  const ctx = await gatherContext(chatId)

  const system = [
    'You are a narrative-design assistant helping track the arc of an ongoing roleplay chat.',
    'Write ONE short-term goal: an immediate, scene-or-chapter-level objective the story should work toward right now.',
    'It does not need to advance the main plot directly — it can develop a character or relationship instead, e.g. "Give Y a way to confront her fears".',
    'It should feel achievable within the next stretch of the conversation, unlike the long-term goal, which is broader.',
    'Respond with ONLY the goal itself as a single sentence. No preamble, no quotes, no labels.',
  ].join('\n')

  const user = [
    longGoal ? `Long-term story goal: ${longGoal}` : '',
    ctx.characterBlock ? `Character (${ctx.characterName}):\n${ctx.characterBlock}` : '',
    ctx.historyBlock ? `Recent conversation:\n${ctx.historyBlock}` : 'The conversation has just begun.',
    'What is the short-term focus for the story right now?',
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const result = await spindle.generate.quiet({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      parameters: { temperature: 0.9, max_tokens: 100 },
    })
    return cleanGoalText(result.content)
  } catch (err: any) {
    spindle.log.error(`Goalify: short-term goal generation failed: ${err?.message ?? err}`)
    return null
  }
}

function cleanGoalText(raw: string): string {
  let text = (raw ?? '').trim()
  // Strip wrapping quotes and stray markdown emphasis the model sometimes adds.
  text = text.replace(/^["'*_\s]+|["'*_\s]+$/g, '')
  // Collapse to a single line.
  text = text.split('\n')[0].trim()
  return text
}

// ---------------------------------------------------------------------------
// Auto-generation triggers on user turns
// ---------------------------------------------------------------------------

async function handleUserMessageSent(chatId: string) {
  const state = await loadState(chatId)
  state.userMessageCount += 1

  const isFirstMessage = state.userMessageCount === 1
  const isSecondMessage = state.userMessageCount === 2

  // Long-term goal: only auto-generate on the first message, and only if
  // nothing was manually set (or already AI-generated) beforehand.
  if (isFirstMessage && !state.long.text) {
    await saveState(state) // persist the counter bump immediately
    await pushState(chatId, state)
    const text = await generateLongTermGoal(chatId)
    if (text) {
      state.long = { text, source: 'ai', updatedAt: Date.now() }
      await saveState(state)
    }
  }

  // Short-term goal: only auto-generate on the second message, and only if
  // nothing was manually set / manually regenerated beforehand.
  if (isSecondMessage && !state.short.text) {
    await saveState(state)
    await pushState(chatId, state)
    const text = await generateShortTermGoal(chatId, state.long.text)
    if (text) {
      state.short = { text, source: 'ai', updatedAt: Date.now() }
      await saveState(state)
    }
  }

  await saveState(state)
  await pushState(chatId, state)
}

spindle.on('MESSAGE_SENT', (payload: any) => {
  const chatId = payload?.chatId
  const role = payload?.message?.role
  if (!chatId || role !== 'user') return
  handleUserMessageSent(chatId).catch((err) => {
    spindle.log.error(`Goalify: error handling MESSAGE_SENT: ${err?.message ?? err}`)
  })
})

spindle.on('CHAT_SWITCHED', (payload: any) => {
  const chatId: string | null = payload?.chatId ?? null
  if (!chatId) {
    pushState(null, null).catch(() => {})
    return
  }
  loadState(chatId)
    .then((state) => pushState(chatId, state))
    .catch((err) => spindle.log.error(`Goalify: error loading state on chat switch: ${err?.message ?? err}`))
})

// ---------------------------------------------------------------------------
// Prompt interceptor — periodic reminders
// ---------------------------------------------------------------------------

function tryRegisterInterceptor() {
  if (!spindle.permissions.has('interceptor')) return

  spindle.registerInterceptor(async (messages: any[], context: any) => {
    const chatId = context?.chatId
    if (!chatId) return messages

    let state: GoalState
    try {
      state = await loadState(chatId)
    } catch {
      return messages
    }

    const count = state.userMessageCount
    const injections: { role: 'system'; content: string; name: string }[] = []

    const injectLong = Boolean(state.long.text) && count > 0 && count % state.longEvery === 0
    const injectShort = Boolean(state.short.text) && count > 0 && count % state.shortEvery === 0

    if (injectLong) {
      injections.push({
        role: 'system',
        name: 'Goalify: Long-term goal',
        content: `[Goalify — Long-term goal] Keep the overarching story moving toward: ${state.long.text}`,
      })
    }
    if (injectShort) {
      injections.push({
        role: 'system',
        name: 'Goalify: Short-term focus',
        content: `[Goalify — Current focus] Right now, work toward: ${state.short.text}`,
      })
    }

    if (injections.length === 0) return messages

    const insertAt = Math.max(messages.length - 1, 0)
    const nextMessages = [
      ...messages.slice(0, insertAt),
      ...injections.map(({ role, content }) => ({ role, content })),
      ...messages.slice(insertAt),
    ]

    const breakdown = injections.map((injection, i) => ({
      messageIndex: insertAt + i,
      name: injection.name,
    }))

    return { messages: nextMessages, breakdown }
  }, 80)
}

tryRegisterInterceptor()
spindle.permissions.onChanged(({ permission, granted }: { permission: string; granted: boolean }) => {
  if (permission === 'interceptor' && granted) tryRegisterInterceptor()
})

// ---------------------------------------------------------------------------
// Frontend RPC
// ---------------------------------------------------------------------------

async function resolveActiveChatId(): Promise<string | null> {
  if (!spindle.permissions.has('chats')) return null
  try {
    const active = await spindle.chats.getActive()
    return active?.id ?? null
  } catch {
    return null
  }
}

spindle.onFrontendMessage(async (payload: FrontendRequest, userId: string) => {
  try {
    switch (payload.type) {
      case 'get_state': {
        const chatId = await resolveActiveChatId()
        const state = chatId ? await loadState(chatId) : null
        await pushState(chatId, state, userId)
        break
      }

      case 'set_long': {
        const state = await loadState(payload.chatId)
        state.long = { text: payload.text.trim(), source: 'user', updatedAt: Date.now() }
        await saveState(state)
        await pushState(payload.chatId, state, userId)
        break
      }

      case 'set_short': {
        const state = await loadState(payload.chatId)
        state.short = { text: payload.text.trim(), source: 'user', updatedAt: Date.now() }
        await saveState(state)
        await pushState(payload.chatId, state, userId)
        break
      }

      case 'regenerate_long': {
        spindle.sendToFrontend({ type: 'busy', chatId: payload.chatId, which: 'long', busy: true }, userId)
        const state = await loadState(payload.chatId)
        const text = await generateLongTermGoal(payload.chatId)
        if (text) {
          state.long = { text, source: 'ai', updatedAt: Date.now() }
          await saveState(state)
        }
        spindle.sendToFrontend({ type: 'busy', chatId: payload.chatId, which: 'long', busy: false }, userId)
        await pushState(payload.chatId, state, userId)
        break
      }

      case 'regenerate_short': {
        spindle.sendToFrontend({ type: 'busy', chatId: payload.chatId, which: 'short', busy: true }, userId)
        const state = await loadState(payload.chatId)
        const text = await generateShortTermGoal(payload.chatId, state.long.text)
        if (text) {
          state.short = { text, source: 'ai', updatedAt: Date.now() }
          await saveState(state)
        }
        spindle.sendToFrontend({ type: 'busy', chatId: payload.chatId, which: 'short', busy: false }, userId)
        await pushState(payload.chatId, state, userId)
        break
      }

      case 'set_intervals': {
        const state = await loadState(payload.chatId)
        state.longEvery = Math.max(1, Math.floor(payload.longEvery) || state.longEvery)
        state.shortEvery = Math.max(1, Math.floor(payload.shortEvery) || state.shortEvery)
        await saveState(state)
        await pushState(payload.chatId, state, userId)
        break
      }
    }
  } catch (err: any) {
    spindle.log.error(`Goalify: RPC error for ${(payload as any)?.type}: ${err?.message ?? err}`)
    spindle.sendToFrontend({ type: 'error', message: err?.message ?? String(err) }, userId)
  }
})

spindle.log.info('Goalify backend loaded.')
