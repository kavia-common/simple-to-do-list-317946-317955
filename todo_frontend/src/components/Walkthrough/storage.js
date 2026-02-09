/**
 * Small localStorage helpers for the in-app walkthrough.
 * Kept isolated for testability and to avoid sprinkling try/catch everywhere.
 */

const DISMISSED_KEY = 'todo_walkthrough_dismissed_v1';

// PUBLIC_INTERFACE
export function getWalkthroughDismissed() {
  /** Returns true if the walkthrough has been dismissed/completed. */
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export function setWalkthroughDismissed(value) {
  /** Persists dismissed/completed state. */
  try {
    localStorage.setItem(DISMISSED_KEY, value ? '1' : '0');
  } catch {
    // Ignore storage errors (private mode, blocked storage, etc.).
  }
}
