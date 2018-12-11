let runningHooks = false;

export default function runHooks(hooks, container, camera, renderer) {
  if (!runningHooks) {
    runningHooks = true;
    for (const hook of hooks) {
      if (hook.skip) {
        continue;
      }
      hook.callback(container, camera, renderer);
      if (hook.throttle) {
        hook.skip = true;
        setTimeout(() => {
          hook.skip = false;
        }, hook.throttle);
      }
    }
    runningHooks = false;
  }
}
