import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { getFirstSetupStep, getNextSetupStep, SETUP_STEP_ORDER } from './steps';

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
    let current: CashDepositSetupRoute | null = SETUP_STEP_ORDER[0];
    while (current) {
      visited.push(current);
      current = getNextSetupStep(current);
    }
    expect(visited).toEqual([...SETUP_STEP_ORDER]);
    expect(getNextSetupStep(Routes.CASH_SETUP_CARD_ADDED)).toBeNull();
  });
});
