type ReadyListener = () => void;

let appReady = false;
let resolveReady: (() => void) | null = null;
const readyPromise = new Promise<void>((resolve) => {
  resolveReady = resolve;
});
const listeners = new Set<ReadyListener>();
const pendingTasks = new Set<Promise<unknown>>();
let taskVersion = 0;

export function isAppReady() {
  return appReady;
}

export function markAppReady() {
  if (appReady) return;
  appReady = true;
  resolveReady?.();
  resolveReady = null;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

export function waitForAppReady() {
  return appReady ? Promise.resolve() : readyPromise;
}

export function onAppReady(listener: ReadyListener) {
  if (appReady) {
    listener();
    return () => {};
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function registerAppReadyTask(task: Promise<unknown>) {
  if (appReady) return;
  pendingTasks.add(task);
  taskVersion += 1;
  task.finally(() => {
    pendingTasks.delete(task);
    taskVersion += 1;
  });
}

export async function waitForAppReadyTasks() {
  let lastVersion = -1;
  while (lastVersion !== taskVersion) {
    lastVersion = taskVersion;
    if (pendingTasks.size === 0) return;
    await Promise.allSettled(Array.from(pendingTasks));
  }
}
