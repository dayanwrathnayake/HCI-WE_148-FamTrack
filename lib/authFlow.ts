// A tiny lock that says "a register/login flow is in progress".
//
// Firebase flips the signed-in user the moment createUser/signIn succeeds, which is BEFORE
// the Firestore profile step has finished (or been rolled back). The route guards must not
// open during that window, so registerUser/loginUser run inside withAuthFlow() and the
// AuthContext only treats the user as signed in when no flow is running.

let depth = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function isAuthFlowActive(): boolean {
  return depth > 0;
}

export function subscribeToAuthFlow(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Runs `fn` with the lock held. The lock is taken BEFORE `fn` starts (so before any
 * Firebase auth call inside it) and always released in `finally`, on success and failure.
 * Nested calls are counted, so an inner call can never release an outer one early.
 */
export async function withAuthFlow<T>(fn: () => Promise<T>): Promise<T> {
  depth += 1;
  notify();
  try {
    return await fn();
  } finally {
    depth = Math.max(0, depth - 1);
    notify();
  }
}
