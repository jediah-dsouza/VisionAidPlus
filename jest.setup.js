// Silent override — no Jest globals required (setupFiles-safe)
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0] || '';
  if (
    (typeof msg === 'string' && (
      msg.includes('Non-serializable values were found in the navigation state') ||
      msg.includes('Failed to parse snapshot')
    )) ||
    (msg instanceof Error && (
      msg.message?.includes('Non-serializable values were found in the navigation state') ||
      msg.message?.includes('Failed to parse snapshot')
    ))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};
