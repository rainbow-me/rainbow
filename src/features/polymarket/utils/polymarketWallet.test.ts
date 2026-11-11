import { setImmediate } from 'node:timers/promises';

import {
  OperationType,
  RelayerTransactionState,
  TransactionType,
  type RelayerTransaction,
  type RelayerTransactionResponse,
} from '@polymarket/builder-relayer-client';
import { describe, expect, it, vi } from 'vitest';

import { createPolymarketWallet } from './polymarketWallet';

const address = '0x0000000000000000000000000000000000000001';
const recipient = '0x0000000000000000000000000000000000000002';
const transfer = { data: '0x', operation: OperationType.Call, to: recipient, value: '1' };

describe('createPolymarketWallet', () => {
  it('waits for deposit-wallet deployment before submitting the first batch', async () => {
    const client = createClient();
    const settlement = Promise.withResolvers<RelayerTransaction>();
    client.deployDepositWallet.mockResolvedValue(createResponse(RelayerTransactionState.STATE_NEW, () => settlement.promise));

    const execution = createPolymarketWallet({ address, kind: 'depositWallet' }, client).then(wallet => wallet.execute([transfer], 'test'));
    await setImmediate();

    expect(client.getDeployed).toHaveBeenCalledWith(address, TransactionType.WALLET);
    expect(client.deployDepositWallet).toHaveBeenCalledTimes(1);
    expect(client.executeDepositWalletBatch).not.toHaveBeenCalled();

    settlement.resolve(createTransaction());
    await execution;

    expect(client.executeDepositWalletBatch).toHaveBeenCalledWith(
      [{ data: '0x', target: recipient, value: '1' }],
      address,
      expect.any(String)
    );
  });

  it('executes directly on an existing Safe and reports relay rejection', async () => {
    const client = createClient();
    client.execute.mockResolvedValue(createResponse(RelayerTransactionState.STATE_FAILED));

    const wallet = await createPolymarketWallet({ address, kind: 'safe' }, client);

    await expect(wallet.execute([transfer], 'test execution')).rejects.toThrow('[polymarket] test execution failed');
    expect(client.execute).toHaveBeenCalledWith([transfer], 'test execution');
    expect(client.getDeployed).not.toHaveBeenCalled();
  });
});

function createClient() {
  const response = createResponse(RelayerTransactionState.STATE_NEW);
  return {
    deployDepositWallet: vi.fn(async () => response),
    execute: vi.fn(async () => response),
    executeDepositWalletBatch: vi.fn(async () => response),
    getDeployed: vi.fn(async () => false),
  };
}

function createResponse(
  state: RelayerTransactionState,
  wait: () => Promise<RelayerTransaction | undefined> = async () => undefined
): RelayerTransactionResponse {
  return {
    getTransaction: async () => [],
    hash: '',
    state,
    transactionHash: '',
    transactionID: 'relay-transaction',
    wait,
  };
}

function createTransaction(): RelayerTransaction {
  return {
    createdAt: new Date(0),
    data: '0x',
    from: '0x0000000000000000000000000000000000000010',
    metadata: '',
    nonce: '0',
    proxyAddress: '0x0000000000000000000000000000000000000001',
    state: RelayerTransactionState.STATE_MINED,
    to: '0x0000000000000000000000000000000000000001',
    transactionHash: '0xhash',
    transactionID: 'relay-transaction',
    type: 'WALLET',
    updatedAt: new Date(0),
    value: '0',
  };
}
