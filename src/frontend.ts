import type { SpindleFrontendContext } from 'lumiverse-spindle-types'

export function setup(ctx: SpindleFrontendContext) {
  // Register a button in the Extras popover on the chat input bar
  const action = ctx.ui.registerInputBarAction({
    id: 'hello-action',
    label: 'Say Hello',
  })

  // Handle clicks
action.onClick(() => {
  const modal = ctx.ui.showModal({ title: 'Hello!' })
  modal.root.innerHTML = '<p style="padding:8px">Hello from my extension! 👋</p>'
  })
  
}