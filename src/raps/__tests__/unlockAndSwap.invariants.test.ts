import { ETH_ADDRESS, SwapType } from '@rainbow-me/swaps';
import { ChainId } from '@/state/backendNetworks/types';
import { createUnlockAndSwapRap } from '../unlockAndSwap';
import { createQuote, createSwapRapParameters, TEST_ALLOWANCE_TARGET } from './fixtures';

jest.mock('@rainbow-me/swaps', () => {
  const actual = jest.requireActual('@rainbow-me/swaps');
  return {
    ...actual,
    isAllowedTargetContract: jest.fn(() => false),
  };
});

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

const swapsModule = jest.requireMock('@rainbow-me/swaps');
const unlockModule = jest.requireMock('../actions/unlock');

describe('createUnlockAndSwapRap invariants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    swapsModule.isAllowedTargetContract.mockReturnValue(false);
  });

  test('skips allowance target validation for unwrap quotes', async () => {
    unlockModule.needsTokenApproval.mockResolvedValue(true);

    const quote = createQuote({
      swapType: SwapType.unwrap,
      allowanceNeeded: false,
      allowanceTarget: TEST_ALLOWANCE_TARGET,
    });

    const result = await createUnlockAndSwapRap(createSwapRapParameters({ quote }));

    expect(swapsModule.isAllowedTargetContract).not.toHaveBeenCalled();
    expect(unlockModule.needsTokenApproval).not.toHaveBeenCalled();
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].type).toBe('swap');
    expect(result.actions.some(action => action.type === 'unlock')).toBe(false);
  });

  test('skips allowance target validation for wrap quotes', async () => {
    unlockModule.needsTokenApproval.mockResolvedValue(true);

    const quote = createQuote({
      swapType: SwapType.wrap,
      sellTokenAddress: ETH_ADDRESS,
      allowanceNeeded: false,
      allowanceTarget: TEST_ALLOWANCE_TARGET,
    });

    const result = await createUnlockAndSwapRap(createSwapRapParameters({ quote }));

    expect(swapsModule.isAllowedTargetContract).not.toHaveBeenCalled();
    expect(unlockModule.needsTokenApproval).not.toHaveBeenCalled();
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].type).toBe('swap');
  });

  test('keeps target allowlist checks for standard ERC20 swaps', async () => {
    unlockModule.needsTokenApproval.mockResolvedValue(false);

    const quote = createQuote({
      swapType: SwapType.normal,
      allowanceNeeded: true,
      allowanceTarget: TEST_ALLOWANCE_TARGET,
    });

    await expect(createUnlockAndSwapRap(createSwapRapParameters({ quote }))).rejects.toThrow('Target address not allowed');
    expect(swapsModule.isAllowedTargetContract).toHaveBeenCalledWith(TEST_ALLOWANCE_TARGET, ChainId.mainnet);
  });
});
