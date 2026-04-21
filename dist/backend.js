// src/backend.ts
var DIRECTOR_PROMPT = `You are a silent narrative director overseeing an ongoing roleplay.
You have been given the current persona, activated world info, recent chat history, and the active goals and objectives.
Assess whether the story is progressing toward the active incomplete items.
Respond in 2-3 sentences only:
- On track  → affirm briefly.    e.g. "The scene is moving well. Keep going."
- Off track → one concrete fix.  e.g. "The plot is drifting. Introduce tension around [X] to push toward the current objective."
Do not address the players. Speak as a director reviewing a draft.`;
var state = {
  goals: [],
  objectives: [],
  goalInterval: 0,
  objectiveInterval: 0,
  selectedMemberId: ""
};
var callCount = 0;
spindle.onFrontendMessage(async (payload, userId) => {
  switch (payload.type) {
    case "gobj_state": {
      state = payload.state;
      break;
    }
    case "get_members": {
      try {
        const { data } = await spindle.characters.list({ limit: 200 });
        spindle.sendToFrontend({
          type: "members",
          members: data.map((c) => ({ id: c.id, name: c.name }))
        }, userId);
      } catch (err) {
        spindle.sendToFrontend({ type: "members", members: [], error: String(err) }, userId);
        spindle.log.error(`[Goals] Failed to list characters: ${String(err)}`);
      }
      break;
    }
  }
});
spindle.registerInterceptor(async (messages, context) => {
  callCount++;
  const { goals, objectives, goalInterval, objectiveInterval, selectedMemberId } = state;
  if (!selectedMemberId)
    return messages;
  const allObjDone = objectives.length === 0 || objectives.every((o) => o.done);
  let thinking = null;
  if (objectiveInterval > 0 && callCount % objectiveInterval === 0) {
    thinking = await callCouncilMember(selectedMemberId, context, "objectives");
  }
  if (goalInterval > 0 && callCount % goalInterval === 0 && allObjDone && thinking === null) {
    thinking = await callCouncilMember(selectedMemberId, context, "goals");
  }
  if (!thinking)
    return messages;
  return [
    { role: "system", content: `[Narrative Director: ${thinking}]` },
    ...messages
  ];
}, 50);
async function callCouncilMember(memberId, context, mode) {
  spindle.sendToFrontend({ type: "gobj_thinking", status: "thinking" });
  try {
    const char = await spindle.characters.get(memberId);
    if (!char)
      throw new Error(`Character ${memberId} not found`);
    const persona = context.personaId ? await spindle.personas.get(context.personaId) : await spindle.personas.getActive();
    const allMessages = await spindle.chat.getMessages(context.chatId);
    const recentMessages = allMessages.slice(-20);
    const worldInfoText = (context.activatedWorldInfo ?? []).map((w) => w.content ?? w.text ?? "").filter(Boolean).join(`
`) || "None";
    const fmtItems = (items) => items.length ? items.map((i) => `[${i.done ? "✓" : " "}] ${i.text}`).join(`
`) : "None";
    const { goals, objectives } = state;
    const activeItems = (mode === "goals" ? goals : objectives).filter((i) => !i.done).map((i) => `- ${i.text}`).join(`
`) || "None";
    const chatText = recentMessages.map((m) => `${m.role}: ${m.content}`).join(`
`) || "None";
    const userMessage = [
      `## Persona
${persona ? `${persona.name}: ${persona.description || persona.title || ""}` : "None"}`,
      `## Activated World Info
${worldInfoText}`,
      `## Recent Chat (last 20 messages)
${chatText}`,
      `## All Goals
${fmtItems(goals)}`,
      `## All Objectives
${fmtItems(objectives)}`,
      `## Currently Analyzing: ${mode === "goals" ? "Goals" : "Objectives"}
Incomplete items:
${activeItems}`,
      `## Your Task
${DIRECTOR_PROMPT}`
    ].join(`

`);
    const systemContent = [char.system_prompt, char.description, char.personality].filter(Boolean).join(`

`);
    const result = await spindle.generate.quiet({
      type: "quiet",
      messages: [
        ...systemContent ? [{ role: "system", content: systemContent }] : [],
        { role: "user", content: userMessage }
      ]
    });
    const thinking = result.content;
    spindle.sendToFrontend({ type: "gobj_thinking", status: "done", text: thinking });
    spindle.log.info(`[Goals] Director (${char.name}): ${thinking.slice(0, 100)}`);
    return thinking;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    spindle.sendToFrontend({ type: "gobj_thinking", status: "error", text: `Council call failed: ${msg}` });
    spindle.log.error(`[Goals] Council call failed: ${msg}`);
    return null;
  }
}
spindle.log.info("[Goals & Objectives] Plugin loaded.");
