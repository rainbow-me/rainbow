import { BigNumber } from '@ethersproject/bignumber';
import { Wallet } from '@ethersproject/wallet';
import { expect, it, vi } from 'vitest';

import { executeEnsTransactions } from './executeTransactions';
import { prepareEnsTransactions } from './transactions';

vi.mock('@/analytics', () => ({ analytics: { event: {}, track: vi.fn() } }));
vi.mock('@/handlers/web3', () => ({ getProvider: vi.fn(), estimateGasWithPadding: () => '50000', toHex: () => '0x0' }));
vi.mock('@/features/gas/utils/parseGas', () => ({ parseGasParamAmounts: () => ({}) }));
vi.mock('@/redux/store', () => ({ default: { getState: () => ({ gas: {} }) } }));
vi.mock('@/state/pendingTransactions/addNewTransaction', () => ({ addNewTransaction: vi.fn() }));
vi.mock('./transactions', () => ({ prepareEnsTransactions: vi.fn() }));

it('stops an NFT send when its last requested record change reverts after broadcast', async () => {
  const signer = new Wallet('0x' + '1'.padStart(64, '0'));
  const to = '0x1111111111111111111111111111111111111111';
  vi.mocked(prepareEnsTransactions).mockResolvedValue([{ to, data: '0x', operation: 'records' }]);
  const failedReceipt = new Error('transaction reverted');
  vi.spyOn(signer, 'sendTransaction').mockResolvedValue({
    from: signer.address,
    nonce: 7,
    gasLimit: BigNumber.from(50000),
    data: '0x',
    value: BigNumber.from(0),
    chainId: 1,
    hash: '0xabc',
    confirmations: 0,
    wait: async () => {
      throw failedReceipt;
    },
  });

  const action = {
    type: 'transfer',
    name: 'alice.eth',
    token: { contractAddress: to, tokenId: '1' },
    toAddress: to,
    clearRecords: true,
    setAddress: false,
    transferControl: false,
  } as const;
  await expect(executeEnsTransactions(signer, action, 7)).rejects.toBe(failedReceipt);
});
