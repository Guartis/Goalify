// Shared shapes between backend.ts and frontend.ts.
// Kept dependency-free (no imports) so both bundles can include it directly.

export type GoalSource = '' | 'user' | 'ai'

export interface Goal {
  text: string
  source: GoalSource
  updatedAt: number
}

export interface GoalState {
  chatId: string
  long: Goal
  short: Goal
  /** Count of user turns sent since Goalify started tracking this chat. */
  userMessageCount: number
  /** Inject the long-term goal reminder every N user turns. */
  longEvery: number
  /** Inject the short-term goal reminder every N user turns. */
  shortEvery: number
}

export function emptyGoal(): Goal {
  return { text: '', source: '', updatedAt: 0 }
}

export function defaultState(chatId: string): GoalState {
  return {
    chatId,
    long: emptyGoal(),
    short: emptyGoal(),
    userMessageCount: 0,
    longEvery: 10,
    shortEvery: 3,
  }
}

// ---- Frontend -> Backend messages ----

export type FrontendRequest =
  | { type: 'get_state' }
  | { type: 'set_long'; chatId: string; text: string }
  | { type: 'set_short'; chatId: string; text: string }
  | { type: 'regenerate_long'; chatId: string }
  | { type: 'regenerate_short'; chatId: string }
  | { type: 'set_intervals'; chatId: string; longEvery: number; shortEvery: number }

// ---- Backend -> Frontend messages ----

export type BackendMessage =
  | { type: 'state'; chatId: string | null; state: GoalState | null; permissions: PermissionSnapshot }
  | { type: 'busy'; chatId: string; which: 'long' | 'short'; busy: boolean }
  | { type: 'error'; message: string }

export interface PermissionSnapshot {
  generation: boolean
  chats: boolean
  chat_mutation: boolean
  characters: boolean
}
