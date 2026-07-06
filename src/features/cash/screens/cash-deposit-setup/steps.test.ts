import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { getFirstSetupStep, getNextSetupStep, getSetupStep, SETUP_STEP_ORDER } from './steps';

describe('Cash Deposit Setup steps', () => {
  it('maps a setup status to its first step', () => {
    expect(getFirstSetupStep('needsIdentity')).toBe(Routes.CASH_SETUP_PHONE);
    expect(getFirstSetupStep('needsCard')).toBe(Routes.CASH_SETUP_CARD_DETAILS);
    expect(getFirstSetupStep('needsWallet')).toBe(Routes.CASH_SETUP_CARD_DETAILS);
  });

  it('has no first step for a ready member', () => {
    expect(getFirstSetupStep('ready')).toBeUndefined();
  });

  it('walks every step in order then terminates', () => {
    const visited: CashDepositSetupRoute[] = [];
    let current: CashDepositSetupRoute | null = SETUP_STEP_ORDER[0].id;
    while (current) {
      visited.push(current);
      current = getNextSetupStep(current);
    }
    expect(visited).toEqual(SETUP_STEP_ORDER.map(step => step.id));
    expect(getNextSetupStep(Routes.CASH_SETUP_CARD_ADDED)).toBeNull();
  });

  it('maps the milestone steps to their facts', () => {
    expect(getSetupStep(Routes.CASH_SETUP_CONFIRM_PHONE)?.milestone).toBe('phoneVerified');
    expect(getSetupStep(Routes.CASH_SETUP_REVIEW)?.milestone).toBe('kycPassed');
    expect(getSetupStep(Routes.CASH_SETUP_PASSKEY)?.milestone).toBe('passkeyRegistered');
    expect(getSetupStep(Routes.CASH_SETUP_CARD_DETAILS)?.milestone).toBeUndefined();
    expect(getSetupStep(Routes.CASH_SETUP_PHONE)?.milestone).toBeUndefined();
  });
});
