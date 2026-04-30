import { BigNumber } from '@ethersproject/bignumber';

import { STAKING_APPROVAL_GAS_LIMIT, STAKING_GAS_LIMIT } from '../constants';
import { checkIfStakingNeedsApproval } from './checkIfStakingNeedsApproval';
import { estimateStakeGasLimit } from './estimateStakeGasLimit';

const mockEstimateGas = jest.fn();

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${chainId}:${address}`,
}));

jest.mock('@/handlers/web3', () => ({
  getProvider: () => ({
    estimateGas: mockEstimateGas,
  }),
}));

jest.mock('./checkIfStakingNeedsApproval', () => ({
  checkIfStakingNeedsApproval: jest.fn(),
}));

const ADDRESS = '0xe5ab64c46313d229d33f7dab3490c9c34806ffb3';

describe('estimateStakeGasLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the shared approval fallback when approval gas estimation fails', async () => {
    jest.mocked(checkIfStakingNeedsApproval).mockResolvedValue(true);
    mockEstimateGas.mockResolvedValueOnce(BigNumber.from(STAKING_GAS_LIMIT)).mockRejectedValueOnce(new Error('estimateGas failed'));

    await expect(estimateStakeGasLimit({ accountAddress: ADDRESS, amount: '100' })).resolves.toBe(
      `${STAKING_GAS_LIMIT + STAKING_APPROVAL_GAS_LIMIT}`
    );
    expect(mockEstimateGas).toHaveBeenCalledTimes(2);
  });
});
