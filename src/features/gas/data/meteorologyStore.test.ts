import { afterAll, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';

import { fetchMeteorology } from './meteorology';
import { mockMeteorologyData } from './meteorologyMock';
import { useMeteorologyStore } from './meteorologyStore';

vi.mock('./meteorology', () => ({ fetchMeteorology: vi.fn() }));

afterAll(() => useMeteorologyStore.getState().reset());

it('maps both fee models to wei without losing base-fee and confirmation-time data', async () => {
  vi.mocked(fetchMeteorology)
    .mockResolvedValueOnce(mockMeteorologyData)
    .mockResolvedValueOnce({
      data: { legacy: { safeGasPrice: '1', proposeGasPrice: '1.5', fastGasPrice: '2' } },
      meta: { feeType: 'legacy', blockNumber: 1, provider: 'rpc' },
    });

  expect(await useMeteorologyStore.getState().load(ChainId.mainnet)).toEqual({
    suggestions: {
      normal: { isEIP1559: true, maxBaseFee: '4659422459', maxPriorityFee: '80328581' },
      fast: { isEIP1559: true, maxBaseFee: '4659422459', maxPriorityFee: '765220124' },
      urgent: { isEIP1559: true, maxBaseFee: '4659422459', maxPriorityFee: '1325069176' },
    },
    currentBaseFee: '3574694345',
    trend: 'rising',
    confirmationTimeByPriorityFee: { '15': '765220123', '30': '80328580', '45': '75063929', '60': '100' },
  });
  expect(await useMeteorologyStore.getState().load(ChainId.bsc)).toEqual({
    suggestions: {
      normal: { isEIP1559: false, gasPrice: '1000000000' },
      fast: { isEIP1559: false, gasPrice: '1500000000' },
      urgent: { isEIP1559: false, gasPrice: '2000000000' },
    },
    trend: 'notrend',
  });
});
