import { Address } from 'viem';

import { staleBalancesStore } from '.';
import { DAI_ADDRESS } from '@/references';
import { ETH_ADDRESS } from '@rainbow-me/swaps';
import { ChainId } from '@/state/backendNetworks/types';

const TEST_ADDRESS_1 = '0xFOO';
const TEST_ADDRESS_2 = '0xBAR';
const THEN = Date.now() - 700000;
const WHEN = Date.now() + 60000;
const OP_ADDRESS = '0x4200000000000000000000000000000000000042';

test('should be able to add asset information to the staleBalances object', async () => {
  const { addStaleBalance, staleBalances } = staleBalancesStore.getState();
  expect(staleBalances).toStrictEqual({});
  addStaleBalance({
    address: TEST_ADDRESS_1,
    chainId: ChainId.mainnet,
    info: {
      address: DAI_ADDRESS,
      transactionHash: '0xFOOBAR',
      expirationTime: THEN,
    },
  });
  addStaleBalance({
    address: TEST_ADDRESS_1,
    chainId: ChainId.mainnet,
    info: {
      address: ETH_ADDRESS,
      transactionHash: '0xFOOBAR',
      expirationTime: WHEN,
    },
  });
  const newStaleBalances = staleBalancesStore.getState().staleBalances;
  expect(newStaleBalances).toStrictEqual({
    [TEST_ADDRESS_1]: {
      [ChainId.mainnet]: {
        [DAI_ADDRESS]: {
          address: DAI_ADDRESS,
          transactionHash: '0xFOOBAR',
          expirationTime: THEN,
        },
        [ETH_ADDRESS]: {
          address: ETH_ADDRESS,
          transactionHash: '0xFOOBAR',
          expirationTime: WHEN,
        },
      },
    },
  });
});

test('should generate accurate stale balance query params and clear expired data - case #1', async () => {
  const { getStaleBalancesQueryParam, clearExpiredData } = staleBalancesStore.getState();
  clearExpiredData(TEST_ADDRESS_1);
  const queryParam = getStaleBalancesQueryParam(TEST_ADDRESS_1);
  expect(queryParam).toStrictEqual(`&token=${ChainId.mainnet}.${ETH_ADDRESS}`);
});

test('should be able to remove expired stale balance and preserve unexpired data', async () => {
  const { addStaleBalance, clearExpiredData } = staleBalancesStore.getState();
  addStaleBalance({
    address: TEST_ADDRESS_1,
    chainId: ChainId.mainnet,
    info: {
      address: DAI_ADDRESS,
      transactionHash: '0xFOOBAR',
      expirationTime: THEN,
    },
  });
  addStaleBalance({
    address: TEST_ADDRESS_1,
    chainId: ChainId.mainnet,
    info: {
      address: ETH_ADDRESS as Address,
      transactionHash: '0xFOOBAR',
      expirationTime: WHEN,
    },
  });
  clearExpiredData(TEST_ADDRESS_1);
  const newStaleBalances = staleBalancesStore.getState().staleBalances;
  expect(newStaleBalances).toStrictEqual({
    [TEST_ADDRESS_1]: {
      [ChainId.mainnet]: {
        [ETH_ADDRESS]: {
          address: ETH_ADDRESS,
          transactionHash: '0xFOOBAR',
          expirationTime: WHEN,
        },
      },
    },
  });
});

test('should preserve data from other addresses when clearing expired data', async () => {
  const { addStaleBalance, clearExpiredData } = staleBalancesStore.getState();
  addStaleBalance({
    address: TEST_ADDRESS_1,
    chainId: ChainId.mainnet,
    info: {
      address: DAI_ADDRESS,
      transactionHash: '0xFOOBAR',
      expirationTime: THEN,
    },
  });
  addStaleBalance({
    address: TEST_ADDRESS_2,
    chainId: ChainId.mainnet,
    info: {
      address: ETH_ADDRESS as Address,
      transactionHash: '0xFOOBAR',
      expirationTime: WHEN,
    },
  });
  clearExpiredData(TEST_ADDRESS_1);
  const newStaleBalances = staleBalancesStore.getState().staleBalances;
  expect(newStaleBalances).toStrictEqual({
    [TEST_ADDRESS_1]: {
      [ChainId.mainnet]: {
        [ETH_ADDRESS]: {
          address: ETH_ADDRESS,
          transactionHash: '0xFOOBAR',
          expirationTime: WHEN,
        },
      },
    },
    [TEST_ADDRESS_2]: {
      [ChainId.mainnet]: {
        [ETH_ADDRESS]: {
          address: ETH_ADDRESS,
          transactionHash: '0xFOOBAR',
          expirationTime: WHEN,
        },
      },
    },
  });
});

test('should generate accurate stale balance query params and clear expired data - case #2', async () => {
  const { getStaleBalancesQueryParam, clearExpiredData } = staleBalancesStore.getState();
  clearExpiredData(TEST_ADDRESS_2);
  const queryParam = getStaleBalancesQueryParam(TEST_ADDRESS_2);
  expect(queryParam).toStrictEqual(`&token=${ChainId.mainnet}.${ETH_ADDRESS}`);
});

test('should generate accurate stale balance query params and clear expired data - case #3', async () => {
  const { addStaleBalance, getStaleBalancesQueryParam, clearExpiredData } = staleBalancesStore.getState();
  addStaleBalance({
    address: TEST_ADDRESS_1,
    chainId: ChainId.optimism,
    info: {
      address: OP_ADDRESS,
      transactionHash: '0xFOOBAR',
      expirationTime: WHEN,
    },
  });

  clearExpiredData(TEST_ADDRESS_1);
  const queryParam = getStaleBalancesQueryParam(TEST_ADDRESS_1);
  expect(queryParam).toStrictEqual(`&token=${ChainId.mainnet}.${ETH_ADDRESS}&token=${ChainId.optimism}.${OP_ADDRESS}`);

  clearExpiredData(TEST_ADDRESS_2);
  const queryParam2 = getStaleBalancesQueryParam(TEST_ADDRESS_2);
  expect(queryParam2).toStrictEqual(`&token=${ChainId.mainnet}.${ETH_ADDRESS}`);
});
