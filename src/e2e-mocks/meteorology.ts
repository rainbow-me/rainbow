import { MeteorologyResponse } from '@/entities/gas';

// Mocked meteorology data for e2e testing.
// Gas fees are set high enough for our anvil setup which uses --block-base-fee-per-gas 100000000 (0.1 gwei).
// baseFeeSuggestion is ~4.66 gwei which is well above anvil's base fee.
export const mockMeteorologyData: MeteorologyResponse = {
  data: {
    currentBaseFee: '3574694345',
    baseFeeSuggestion: '4659422459',
    baseFeeTrend: 1,
    blocksToConfirmationByBaseFee: {
      '4': '4385338784',
      '8': '4127377679',
      '40': '3884590757',
      '120': '3656085418',
      '240': '3441021570',
    },
    blocksToConfirmationByPriorityFee: {
      '1': '765220123',
      '2': '80328580',
      '3': '75063929',
      '4': '100',
    },
    confirmationTimeByPriorityFee: {
      '15': '765220123',
      '30': '80328580',
      '45': '75063929',
      '60': '100',
    },
    maxPriorityFeeSuggestions: {
      fast: '765220124',
      normal: '80328581',
      urgent: '1325069176',
    },
    secondsPerNewBlock: 12,
    meta: {
      blockNumber: 22719166,
      provider: 'rpc',
    },
  },
  meta: {
    feeType: 'eip1559',
    blockNumber: '22719166',
    provider: 'rpc',
  },
};
