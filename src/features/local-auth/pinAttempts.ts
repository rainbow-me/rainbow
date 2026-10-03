export const MAX_PIN_ATTEMPTS = 10;
export const PIN_LOCKOUT_MINUTES = 5;

export type PinAttemptState = {
  attemptsLeft: number;
  lockedUntil: number | null;
};

function lockPinAttempts(now: number): PinAttemptState {
  return { attemptsLeft: 0, lockedUntil: now + PIN_LOCKOUT_MINUTES * 60 * 1000 };
}

export function restorePinAttempts(storedAttempts: unknown, storedLockedUntil: unknown, now: number): PinAttemptState {
  if (storedLockedUntil !== null && storedLockedUntil !== undefined) {
    if (typeof storedLockedUntil !== 'number' || !Number.isSafeInteger(storedLockedUntil) || storedLockedUntil <= 0) {
      return lockPinAttempts(now);
    }

    if (storedLockedUntil > now) {
      return { attemptsLeft: 0, lockedUntil: storedLockedUntil };
    }

    return { attemptsLeft: MAX_PIN_ATTEMPTS, lockedUntil: null };
  }

  if (storedAttempts === null || storedAttempts === undefined) {
    return { attemptsLeft: MAX_PIN_ATTEMPTS, lockedUntil: null };
  }

  if (typeof storedAttempts !== 'number' || !Number.isInteger(storedAttempts) || storedAttempts <= 0 || storedAttempts > MAX_PIN_ATTEMPTS) {
    // Includes negative counters persisted by the previous implementation.
    return lockPinAttempts(now);
  }

  return { attemptsLeft: storedAttempts, lockedUntil: null };
}

export function recordFailedPinAttempt(state: PinAttemptState, now: number): PinAttemptState {
  const current = restorePinAttempts(state.attemptsLeft, state.lockedUntil, now);
  if (current.lockedUntil !== null) return current;

  const attemptsLeft = Math.max(0, current.attemptsLeft - 1);
  return attemptsLeft === 0 ? lockPinAttempts(now) : { attemptsLeft, lockedUntil: null };
}
