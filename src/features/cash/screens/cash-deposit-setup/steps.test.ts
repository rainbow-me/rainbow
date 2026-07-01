import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { EMPTY_CASH_DEPOSIT_SETUP_FACTS } from '../../stores/deriveCashDepositSetupStatus';
import { getFirstSetupStep, getNextSetupStep, getSetupStep, SETUP_STEP_ORDER } from './steps';

describe('Cash Deposit Setup steps', () => {
  it('derives the first step from facts', () => {
    expect(getFirstSetupStep(EMPTY_CASH_DEPOSIT_SETUP_FACTS)).toBe(Routes.CASH_SETUP_PHONE);
    expect(
      getFirstSetupStep({ phoneVerified: true, kycPassed: true, passkeyRegistered: true, hasLinkedCard: false, hasLinkedWallet: false })
    ).toBe(Routes.CASH_SETUP_CARD_DETAILS);
  });

  it('has no first step for a ready member', () => {
    expect(
      getFirstSetupStep({ phoneVerified: true, kycPassed: true, passkeyRegistered: true, hasLinkedCard: true, hasLinkedWallet: true })
    ).toBeUndefined();
  });

  it('walks every step in order then terminates', () => {
    const visited: CashDepositSetupRoute[] = [];
    let current: CashDepositSetupRoute | null = SETUP_STEP_ORDER[0].id;
    while (current) {
      visited.push(current);
      current = getNextSetupStep(current);
    }
    expect(visited).toEqual(SETUP_STEP_ORDER.map(step => step.id));
    expect(getNextSetupStep(Routes.CASH_SETUP_CARD_DETAILS)).toBeNull();
  });

  it('maps the milestone steps to their facts', () => {
    expect(getSetupStep(Routes.CASH_SETUP_CONFIRM_PHONE)?.milestone).toBe('phoneVerified');
    expect(getSetupStep(Routes.CASH_SETUP_REVIEW)?.milestone).toBe('kycPassed');
    expect(getSetupStep(Routes.CASH_SETUP_PASSKEY)?.milestone).toBe('passkeyRegistered');
    expect(getSetupStep(Routes.CASH_SETUP_CARD_DETAILS)?.milestone).toBe('hasLinkedCard');
    expect(getSetupStep(Routes.CASH_SETUP_PHONE)?.milestone).toBeUndefined();
  });
});
