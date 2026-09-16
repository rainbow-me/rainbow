import { selectCanSubmitReview, useCashSetupSessionStore, type PhoneVerificationChallenge } from './cashSetupSessionStore';

const NOW = 1_750_000_000_000;
const CHALLENGE: PhoneVerificationChallenge = { kind: 'signup', userId: 'user-1' };
const BOOTSTRAP_TOKEN = 'bst_1';

const store = () => useCashSetupSessionStore.getState();

function verifyPhone(expiresAt = NOW + 60_000) {
  store().setPhoneSubmitted({ challenge: CHALLENGE, phoneNationalNumber: '4155550100', resendAfter: 0 });
  store().setPhoneVerified(CHALLENGE, { bootstrapToken: BOOTSTRAP_TOKEN, expiresAt });
}

function setPersonalDetails() {
  store().setFirstName('Ada');
  store().setLastName('Lovelace');
  store().setDateOfBirth({ year: 1990, month: 1, day: 2 });
  store().setSsnLast4('1234');
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  store().reset();
});

afterEach(() => {
  store().reset();
  jest.useRealTimers();
});

it('clears the retained session when its bootstrap credential expires', () => {
  verifyPhone();
  setPersonalDetails();

  jest.advanceTimersByTime(59_999);
  expect(store().session).toMatchObject({ status: 'phoneVerified', ssnLast4: '1234' });

  jest.advanceTimersByTime(1);
  expect(store().session).toEqual({ status: 'empty' });
});

it('removes personal details once KYC is submitted while retaining the credential', () => {
  verifyPhone();
  setPersonalDetails();

  store().markKycSubmitted(BOOTSTRAP_TOKEN);

  expect(store().session).toEqual({
    status: 'phoneVerified',
    source: 'signup',
    phoneNationalNumber: '4155550100',
    bootstrapToken: BOOTSTRAP_TOKEN,
    bootstrapTokenExpiresAt: NOW + 60_000,
    kycSubmission: 'submitted',
  });
});

it('clears a submitted session when its bootstrap credential expires', () => {
  verifyPhone();
  store().markKycSubmitted(BOOTSTRAP_TOKEN);

  jest.advanceTimersByTime(60_000);

  expect(store().session).toEqual({ status: 'empty' });
});

it('does not allow review submission after the bootstrap credential expires by wall clock', () => {
  verifyPhone();
  expect(selectCanSubmitReview(store())).toBe(true);

  jest.setSystemTime(NOW + 60_000);

  expect(selectCanSubmitReview(store())).toBe(false);
});
