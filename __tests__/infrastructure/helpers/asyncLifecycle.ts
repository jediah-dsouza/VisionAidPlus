export const ASYNC_FLUSH_MS = 100;

export async function flushMicrotasks(): Promise<void> {
  await new Promise(resolve => setImmediate(resolve));
}

export async function stabilizeAsync(ticks: number = 3): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await flushMicrotasks();
  }
}

export function waitForTimer(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}
