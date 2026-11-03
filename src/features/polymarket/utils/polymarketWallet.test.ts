import { setImmediate } from 'node:timers/promises';

import {
  OperationType,
  RelayerTransactionState,
  TransactionType,
  type RelayerTransaction,
  type RelayerTransactionResponse,
} from '@polymarket/builder-relayer-client';
import { SignatureTypeV2 } from '@polymarket/clob-client-v2';
import { describe, expect, it, vi } from 'vitest';

import { createPolymarketWallet } from './polymarketWallet';

describe('createPolymarketWallet', () => {
  it('initializes an undeployed wallet before returning it', async () => {
    const client = createClient({ isDeployed: false });
    const descriptor = createDescriptor('0x0000000000000000000000000000000000000001');

    const settlement = Promise.withResolvers<RelayerTransaction>();
    client.waitForSettlement.mockReturnValueOnce(settlement.promise);

    const execution = createPolymarketWallet(descriptor, client).then(wallet => wallet.execute([], 'test execution'));
    await setImmediate();

    expect(client.deploy).toHaveBeenCalledTimes(1);
    expect(client.waitForSettlement).toHaveBeenCalledTimes(1);
    expect(client.execute).not.toHaveBeenCalled();

    settlement.resolve(createTransaction());
    await execution;

    expect(client.execute).toHaveBeenCalledWith([], 'test execution');
  });

  it('uses deposit-wallet deployment and execution operations', async () => {
    const client = createClient({ isDeployed: false });
    const descriptor = {
      ...createDescriptor('0x0000000000000000000000000000000000000003'),
      kind: 'depositWallet' as const,
      signatureType: SignatureTypeV2.POLY_1271,
    };

    const wallet = await createPolymarketWallet(descriptor, client);
    await wallet.execute([{ data: '0x1234', operation: OperationType.Call, to: descriptor.address, value: '0' }], 'ignored');

    expect(client.getDeployed).toHaveBeenCalledWith(descriptor.address, TransactionType.WALLET);
    expect(client.deployDepositWallet).toHaveBeenCalledTimes(1);
    expect(client.executeDepositWalletBatch).toHaveBeenCalledWith(
      [{ data: '0x1234', target: descriptor.address, value: '0' }],
      descriptor.address,
      expect.any(String)
    );
  });

  it('rejects failed relay submissions at the wallet boundary', async () => {
    const client = createClient({ isDeployed: true });
    const wallet = await createPolymarketWallet(createDescriptor('0x0000000000000000000000000000000000000004'), client);
    client.execute.mockResolvedValueOnce(createResponse(RelayerTransactionState.STATE_FAILED));

    await expect(wallet.execute([], 'test execution')).rejects.toThrow('[polymarket] test execution failed');
  });
});

function createDescriptor(address: `0x${string}`) {
  return {
    address,
    kind: 'safe' as const,
    owner: '0x0000000000000000000000000000000000000010' as const,
    signatureType: SignatureTypeV2.POLY_GNOSIS_SAFE,
  };
}

function createClient({ isDeployed }: { isDeployed: boolean }) {
  const waitForSettlement = vi.fn(async () => createTransaction());
  const response = createResponse(RelayerTransactionState.STATE_NEW, waitForSettlement);

  return {
    deploy: vi.fn(async () => response),
    deployDepositWallet: vi.fn(async () => response),
    execute: vi.fn(async () => response),
    executeDepositWalletBatch: vi.fn(async () => response),
    getDeployed: vi.fn(async () => isDeployed),
    waitForSettlement,
  };
}

function createResponse(
  state: RelayerTransactionState,
  wait: () => Promise<RelayerTransaction | undefined> = async () => createTransaction()
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
    type: 'SAFE',
    updatedAt: new Date(0),
    value: '0',
  };
}
