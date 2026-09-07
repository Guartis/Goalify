# Goalify

A [Spindle](https://docs.lumiverse.chat) extension for [Lumiverse](https://lumiverse.chat) that tracks a **long-term narrative goal** and a **short-term focus** per chat, can auto-generate both from context, lets you edit or regenerate them at any time, and periodically reminds the AI to work toward them.

## Concepts

- **Long-term goal** — the big-picture arc for the whole story (scale: "Redemption of Kael"). Rarely changes.
- **Short-term focus** — a scene/chapter-level objective (scale: "Give Mira a way to confront her fears"). Doesn't have to advance the main plot directly, but keeps the story purposeful. Changes more often, and is reminded to the AI more frequently than the long-term goal.

## Behavior

- **First message in a chat:** if you haven't manually set a long-term goal (via the Goalify tab) before sending it, Goalify asks the AI to invent one from the character card + conversation so far.
- **Second message:** same deal for the short-term focus — skipped if you already set or generated one yourself.
- **Editing:** open the **Goalify** tab in the sidebar drawer at any time to rewrite either goal by hand. Manual edits always stick — nothing overwrites them automatically.
- **Regenerating:** each goal has its own "Regenerate" button, usable anytime, independent of the auto-generation rule above.
- **Reminders:** both goals are periodically re-injected into the prompt as short system notes (visible in Prompt Breakdown), on a schedule you control — by default every 10 user messages for the long-term goal and every 3 for the short-term focus. Edit these under "Reminder frequency" in the tab.

## Project layout

```
goalify/
├── spindle.json          # extension manifest
├── src/
│   ├── types.ts           # shared GoalState / RPC message shapes
│   ├── backend.ts         # storage, auto-gen, interceptor, RPC (Bun worker)
│   └── frontend.ts        # drawer tab UI (browser)
├── dist/                  # built output (checked in for convenience)
│   ├── backend.js
│   └── frontend.js
├── package.json
└── tsconfig.json
```

## Building

```bash
npm install
npm run build       # -> dist/backend.js, dist/frontend.js
```

`dist/` is committed so the extension installs and runs without a build step, but re-run `npm run build` after any change under `src/`.

## Installing

Point Lumiverse's Extensions panel (or `POST /api/v1/spindle/install`) at this repo. After install, grant the permissions Goalify asks for from the Extensions panel:

| Permission | Used for |
|---|---|
| `generation` | Auto-generating and regenerating goals |
| `interceptor` | Injecting the periodic reminders into the prompt |
| `chats` | Reading the active chat / chat metadata |
| `chat_mutation` | Reading recent messages for goal-generation context |
| `characters` | Reading the character card for goal-generation context |

Goalify degrades gracefully without `generation` (you can still write goals by hand, just can't auto-generate/regenerate), and without `chats`/`chat_mutation`/`characters` (goal generation just has less context to work with).

## Notes for future contributors

- Goal state is stored per-chat at `goals/{chatId}.json` in the extension's Spindle storage.
- The `lumiverse-spindle-types` package on npm (0.1.9 as of writing) lags a few documented APIs this extension uses (`permissions.has()`/`onChanged()`, the 2-arg `sendToFrontend`, extra `registerDrawerTab` metadata fields, etc). `spindle`/`ctx` are typed as `any` in the two entry files to avoid fighting a stale `.d.ts` — see the comments at the top of `backend.ts` and `frontend.ts`. Restore the typed imports once an updated package version ships.
- Injection uses a simple message-count modulo, not "N messages since last injection," so changing the interval takes effect immediately on the next matching multiple.
