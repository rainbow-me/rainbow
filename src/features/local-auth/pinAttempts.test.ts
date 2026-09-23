import { MAX_PIN_ATTEMPTS, PIN_LOCKOUT_MINUTES, recordFailedPinAttempt, restorePinAttempts } from './pinAttempts';

const NOW = 1_800_000_000_000;
const LOCKOUT_MS = PIN_LOCKOUT_MINUTES * 60 * 1000;

describe('PIN attempt limits', () => {
  it.each([null, undefined])('starts a missing counter (%s) with ten attempts', missing => {
    expect(restorePinAttempts(missing, null, NOW)).toEqual({ attemptsLeft: MAX_PIN_ATTEMPTS, lockedUntil: null });
  });

  it('locks on failure ten and preserves the deadline when reopened', () => {
    let state = restorePinAttempts(null, null, NOW);
    for (let attempt = 1; attempt < MAX_PIN_ATTEMPTS; attempt += 1) {
      state = recordFailedPinAttempt(state, NOW);
      expect(state).toEqual({ attemptsLeft: MAX_PIN_ATTEMPTS - attempt, lockedUntil: null });
      state = restorePinAttempts(state.attemptsLeft, state.lockedUntil, NOW);
    }
    state = recordFailedPinAttempt(state, NOW);
    expect(state).toEqual({ attemptsLeft: 0, lockedUntil: NOW + LOCKOUT_MS });
    expect(restorePinAttempts(state.attemptsLeft, state.lockedUntil, NOW + 1)).toEqual(state);
    expect(recordFailedPinAttempt(state, NOW + 1)).toEqual(state);
  });

  it.each([0, -1, -12, '10', NaN, Infinity, 1.5, 11])('locks an invalid or exhausted counter (%s)', counter => {
    expect(restorePinAttempts(counter, null, NOW)).toEqual({ attemptsLeft: 0, lockedUntil: NOW + LOCKOUT_MS });
  });

  it('retains an active lockout even if the counter is missing', () => {
    expect(restorePinAttempts(null, NOW + 1000, NOW)).toEqual({ attemptsLeft: 0, lockedUntil: NOW + 1000 });
  });

  it('restores the full budget when the lockout expires', () => {
    expect(restorePinAttempts(0, NOW, NOW)).toEqual({ attemptsLeft: MAX_PIN_ATTEMPTS, lockedUntil: null });
    expect(restorePinAttempts(-12, NOW - 1, NOW)).toEqual({ attemptsLeft: MAX_PIN_ATTEMPTS, lockedUntil: null });
  });

  it.each([0, -1, 'invalid', NaN, Infinity, 1.5])('does not accept a malformed lockout deadline (%s)', deadline => {
    expect(restorePinAttempts(10, deadline, NOW)).toEqual({ attemptsLeft: 0, lockedUntil: NOW + LOCKOUT_MS });
  });
});
