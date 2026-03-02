import { createClaimClaimableRap } from '../claimClaimable';
import type { RapAction } from '../references';
import { createClaimClaimableRapParameters, createQuote, TEST_ALLOWANCE_TARGET, TEST_QUOTE_TO } from './fixtures';

jest.mock('../common', () => ({
  createNewAction: jest.fn((type: string, parameters: unknown) => ({
    type,
    parameters,
    transaction: { hash: null },
  })),
  createNewRap: jest.fn((actions: unknown[]) => ({ actions })),
}));

jest.mock('../actions/unlock', () => ({
  needsTokenApproval: jest.fn(),
}));

jest.mock('@/__swaps__/utils/quotes', () => ({
  isCrosschainQuote: jest.fn(),
}));

const unlockModule = jest.requireMock('../actions/unlock');
const quoteUtilsModule = jest.requireMock('@/__swaps__/utils/quotes');

describe('createClaimClaimableRap invariants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    quoteUtilsModule.isCrosschainQuote.mockReturnValue(false);
  });

  test('uses allowanceTarget as spender for approval checks and unlock action', async () => {
    unlockModule.needsTokenApproval.mockResolvedValue(true);

    const quote = createQuote({
      allowanceNeeded: true,
      allowanceTarget: TEST_ALLOWANCE_TARGET,
      to: TEST_QUOTE_TO,
    });
    const parameters = createClaimClaimableRapParameters({ quote });

    const result = await createClaimClaimableRap(parameters);

    expect(unlockModule.needsTokenApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        spender: TEST_ALLOWANCE_TARGET,
      })
    );

    const unlockAction = result.actions.find(isUnlockAction);
    expect(unlockAction).toBeDefined();
    expect(unlockAction?.parameters.contractAddress).toBe(TEST_ALLOWANCE_TARGET);
    expect(unlockAction?.parameters.contractAddress).not.toBe(TEST_QUOTE_TO);
  });

  test('still checks on-chain approval and skips unlock action when allowance is not needed', async () => {
    unlockModule.needsTokenApproval.mockResolvedValue(false);

    const quote = createQuote({
      allowanceNeeded: false,
    });

    const result = await createClaimClaimableRap(createClaimClaimableRapParameters({ quote }));

    expect(unlockModule.needsTokenApproval).toHaveBeenCalledTimes(1);
    expect(result.actions.find(action => action.type === 'unlock')).toBeUndefined();
  });
});

function isUnlockAction(action: RapAction<'claimClaimable' | 'crosschainSwap' | 'unlock' | 'swap'>): action is RapAction<'unlock'> {
  return action.type === 'unlock';
}
