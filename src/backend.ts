declare const spindle: import('lumiverse-spindle-types').SpindleAPI

// ── Shared types (inlined — backend uses declare global, not ES module imports) ─
interface Item { text: string; done: boolean }
interface GobjState {
  goals:             Item[]
  objectives:        Item[]
  goalInterval:      number
  objectiveInterval: number
  selectedMemberId:  string  // CharacterDTO.id
}

// ── Hardcoded director prompt ──────────────────────────────────────────────────
const DIRECTOR_PROMPT = `You are a silent narrative director overseeing an ongoing roleplay.
You have been given the current persona, activated world info, recent chat history, and the active goals and objectives.
Assess whether the story is progressing toward the active incomplete items.
Respond in 2-3 sentences only:
- On track  → affirm briefly.    e.g. "The scene is moving well. Keep going."
- Off track → one concrete fix.  e.g. "The plot is drifting. Introduce tension around [X] to push toward the current objective."
Do not address the players. Speak as a director reviewing a draft.`

// ── Runtime state ──────────────────────────────────────────────────────────────
let state: GobjState = {
  goals:            [],
  objectives:       [],
  goalInterval:     0,
  objectiveInterval: 0,
  selectedMemberId: '',
}
let callCount = 0

// ── Frontend message handler ───────────────────────────────────────────────────
spindle.onFrontendMessage(async (payload: any, userId) => {
  switch (payload.type) {

    // Frontend pushed a full state snapshot on every change
    case 'gobj_state': {
      state = payload.state as GobjState
      break
    }

    // Frontend requests the member list to populate the selector
    case 'get_members': {
      try {
        const { data } = await spindle.characters.list({ limit: 200 })
        spindle.sendToFrontend({
          type: 'members',
          members: data.map(c => ({ id: c.id, name: c.name })),
        }, userId)
      } catch (err) {
        spindle.sendToFrontend({ type: 'members', members: [], error: String(err) }, userId)
        spindle.log.error(`[Goals] Failed to list characters: ${String(err)}`)
      }
      break
    }
  }
})

// ── Interceptor — runs before every LLM call ──────────────────────────────────
// Priority 50: runs early, before most other interceptors.
spindle.registerInterceptor(async (messages, context) => {
  callCount++

  const { goals, objectives, goalInterval, objectiveInterval, selectedMemberId } = state

  if (!selectedMemberId) return messages

  const allObjDone = objectives.length === 0 || objectives.every(o => o.done)

  let thinking: string | null = null

  // Objectives trigger
  if (objectiveInterval > 0 && callCount % objectiveInterval === 0) {
    thinking = await callCouncilMember(selectedMemberId, context, 'objectives')
  }

  // Goals trigger — only fires when every objective is marked done.
  // Also skips if objectives already triggered this call.
  if (goalInterval > 0 && callCount % goalInterval === 0 && allObjDone && thinking === null) {
    thinking = await callCouncilMember(selectedMemberId, context, 'goals')
  }

  if (!thinking) return messages

  // Prepend director note as a system message for this generation
  return [
    { role: 'system' as const, content: `[Narrative Director: ${thinking}]` },
    ...messages,
  ]
}, 50)

// ── callCouncilMember ──────────────────────────────────────────────────────────
async function callCouncilMember(
  memberId:  string,
  context:   any,
  mode:      'goals' | 'objectives'
): Promise<string | null> {

  spindle.sendToFrontend({ type: 'gobj_thinking', status: 'thinking' })

  try {
    // Character acting as council member
    const char = await spindle.characters.get(memberId)
    if (!char) throw new Error(`Character ${memberId} not found`)

    // Active persona — prefer the one the interceptor context knows about
    const persona = context.personaId
      ? await spindle.personas.get(context.personaId)
      : await spindle.personas.getActive()

    // Last 20 messages from this chat
    const allMessages  = await spindle.chat.getMessages(context.chatId)
    const recentMessages = allMessages.slice(-20)

    // World info entries already activated for this generation by the prompt pipeline
    const worldInfoText = ((context.activatedWorldInfo ?? []) as any[])
      .map(w => w.content ?? w.text ?? '')
      .filter(Boolean)
      .join('\n') || 'None'

    const fmtItems = (items: Item[]) =>
      items.length
        ? items.map(i => `[${i.done ? '✓' : ' '}] ${i.text}`).join('\n')
        : 'None'

    const { goals, objectives } = state
    const activeItems = (mode === 'goals' ? goals : objectives)
      .filter(i => !i.done)
      .map(i => `- ${i.text}`)
      .join('\n') || 'None'

    const chatText = recentMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n') || 'None'

    const userMessage = [
      `## Persona\n${persona ? `${persona.name}: ${persona.description || persona.title || ''}` : 'None'}`,
      `## Activated World Info\n${worldInfoText}`,
      `## Recent Chat (last 20 messages)\n${chatText}`,
      `## All Goals\n${fmtItems(goals)}`,
      `## All Objectives\n${fmtItems(objectives)}`,
      `## Currently Analyzing: ${mode === 'goals' ? 'Goals' : 'Objectives'}\nIncomplete items:\n${activeItems}`,
      `## Your Task\n${DIRECTOR_PROMPT}`,
    ].join('\n\n')

    // Build system prompt from the character's own fields
    const systemContent = [char.system_prompt, char.description, char.personality]
      .filter(Boolean)
      .join('\n\n')

    // Fire generation using the user's active connection profile
const result = await spindle.generate.quiet({
  type: 'quiet',
  messages: [
    ...(systemContent ? [{ role: 'system' as const, content: systemContent }] : []),
    { role: 'user' as const, content: userMessage },
  ],
}) as { content: string }; // Add this line

const thinking = result.content;
    spindle.sendToFrontend({ type: 'gobj_thinking', status: 'done', text: thinking })
    spindle.log.info(`[Goals] Director (${char.name}): ${thinking.slice(0, 100)}`)

    return thinking

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    spindle.sendToFrontend({ type: 'gobj_thinking', status: 'error', text: `Council call failed: ${msg}` })
    spindle.log.error(`[Goals] Council call failed: ${msg}`)
    return null
  }
}

spindle.log.info('[Goals & Objectives] Plugin loaded.')