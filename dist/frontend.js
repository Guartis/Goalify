// src/frontend.ts
function setup(ctx) {
  const action = ctx.ui.registerInputBarAction({
    id: "hello-action",
    label: "Say Hello"
  });
  action.onClick(() => {
    const modal = ctx.ui.showModal({ title: "Hello!" });
    modal.root.innerHTML = '<p style="padding:8px">Hello from my extension! \uD83D\uDC4B</p>';
  });
}
export {
  setup
};
