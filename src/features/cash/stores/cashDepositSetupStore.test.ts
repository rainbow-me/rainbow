import { useCashDepositSetupStore } from './cashDepositSetupStore';
import { EMPTY_CASH_DEPOSIT_SETUP_FACTS } from './deriveCashDepositSetupStatus';

describe('cashDepositSetupStore facts', () => {
  beforeEach(() => useCashDepositSetupStore.setState({ facts: EMPTY_CASH_DEPOSIT_SETUP_FACTS }));

  it('setFact merges a single key without clobbering siblings', () => {
    const { setFact } = useCashDepositSetupStore.getState();
    setFact('phoneVerified', true);
    setFact('kycPassed', true);

    const { facts } = useCashDepositSetupStore.getState();
    expect(facts.phoneVerified).toBe(true);
    expect(facts.kycPassed).toBe(true);
  });
});
