const TEST_ADDRESS_1 = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

const TEST_ADDRESS_2 = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';

const TEST_ADDRESS_3 = '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';

import { nonceStore } from '.';

// from networks/types to get around mocking a bunch of imports

enum Network {
  arbitrum = 'arbitrum',
  goerli = 'goerli',
  mainnet = 'mainnet',
  optimism = 'optimism',
  polygon = 'polygon',
  base = 'base',
  bsc = 'bsc',
  zora = 'zora',
  gnosis = 'gnosis',
}

test('should be able to set nonce for one wallet in one network', async () => {
  const { nonces, setNonce } = nonceStore.getState();
  expect(nonces).toStrictEqual({});
  setNonce({
    address: TEST_ADDRESS_1,
    currentNonce: 1,
    latestConfirmedNonce: 1,
    network: Network.mainnet,
  });
  const newNonces = nonceStore.getState().nonces;
  expect(newNonces).toStrictEqual({
    [TEST_ADDRESS_1]: {
      [Network.mainnet]: {
        currentNonce: 1,
        latestConfirmedNonce: 1,
      },
    },
  });
});

test('should be able to set nonce for same wallet in a different network', async () => {
  const { setNonce } = nonceStore.getState();
  setNonce({
    address: TEST_ADDRESS_1,
    currentNonce: 4,
    latestConfirmedNonce: 4,
    network: Network.optimism,
  });
  const newNonces = nonceStore.getState().nonces;
  expect(newNonces).toStrictEqual({
    [TEST_ADDRESS_1]: {
      [Network.mainnet]: {
        currentNonce: 1,
        latestConfirmedNonce: 1,
      },
      [Network.optimism]: {
        currentNonce: 4,
        latestConfirmedNonce: 4,
      },
    },
  });
});

test('should be able to set nonce for other wallet in one network', async () => {
  const { setNonce } = nonceStore.getState();
  setNonce({
    address: TEST_ADDRESS_2,
    currentNonce: 2,
    latestConfirmedNonce: 2,
    network: Network.mainnet,
  });
  const newNonces = nonceStore.getState().nonces;
  expect(newNonces).toStrictEqual({
    [TEST_ADDRESS_1]: {
      [Network.mainnet]: {
        currentNonce: 1,
        latestConfirmedNonce: 1,
      },
      [Network.optimism]: {
        currentNonce: 4,
        latestConfirmedNonce: 4,
      },
    },
    [TEST_ADDRESS_2]: {
      [Network.mainnet]: {
        currentNonce: 2,
        latestConfirmedNonce: 2,
      },
    },
  });
});

test('should be able to set nonce for other wallet in other network', async () => {
  const { setNonce } = nonceStore.getState();
  setNonce({
    address: TEST_ADDRESS_3,
    currentNonce: 3,
    latestConfirmedNonce: 3,
    network: Network.arbitrum,
  });
  const newNonces = nonceStore.getState().nonces;
  expect(newNonces).toStrictEqual({
    [TEST_ADDRESS_1]: {
      [Network.mainnet]: {
        currentNonce: 1,
        latestConfirmedNonce: 1,
      },
      [Network.optimism]: {
        currentNonce: 4,
        latestConfirmedNonce: 4,
      },
    },
    [TEST_ADDRESS_2]: {
      [Network.mainnet]: {
        currentNonce: 2,
        latestConfirmedNonce: 2,
      },
    },
    [TEST_ADDRESS_3]: {
      [Network.arbitrum]: {
        currentNonce: 3,
        latestConfirmedNonce: 3,
      },
    },
  });
});

test('should be able to set nonce nonce information correctly', async () => {
  const { setNonce, getNonce } = nonceStore.getState();
  setNonce({
    address: TEST_ADDRESS_3,
    currentNonce: 3,
    latestConfirmedNonce: 3,
    network: Network.arbitrum,
  });
  const nonces11 = getNonce({
    address: TEST_ADDRESS_1,
    network: Network.mainnet,
  });
  const nonces12 = getNonce({
    address: TEST_ADDRESS_1,
    network: Network.optimism,
  });
  const nonces2 = getNonce({
    address: TEST_ADDRESS_2,
    network: Network.mainnet,
  });
  const nonces3 = getNonce({
    address: TEST_ADDRESS_3,
    network: Network.arbitrum,
  });
  expect(nonces11?.currentNonce).toEqual(1);
  expect(nonces11?.latestConfirmedNonce).toEqual(1);
  expect(nonces12?.currentNonce).toEqual(4);
  expect(nonces12?.latestConfirmedNonce).toEqual(4);
  expect(nonces2?.currentNonce).toEqual(2);
  expect(nonces2?.latestConfirmedNonce).toEqual(2);
  expect(nonces3?.currentNonce).toEqual(3);
  expect(nonces3?.latestConfirmedNonce).toEqual(3);
});

test('should be able to update nonce', async () => {
  const { setNonce, getNonce } = nonceStore.getState();
  setNonce({
    address: TEST_ADDRESS_1,
    currentNonce: 30,
    latestConfirmedNonce: 30,
    network: Network.mainnet,
  });
  const updatedNonce = getNonce({
    address: TEST_ADDRESS_1,
    network: Network.mainnet,
  });
  const oldNonce = getNonce({
    address: TEST_ADDRESS_1,
    network: Network.optimism,
  });
  expect(updatedNonce?.currentNonce).toStrictEqual(30);
  expect(updatedNonce?.latestConfirmedNonce).toStrictEqual(30);
  expect(oldNonce?.currentNonce).toStrictEqual(4);
  expect(oldNonce?.latestConfirmedNonce).toStrictEqual(4);
  setNonce({
    address: TEST_ADDRESS_1,
    currentNonce: 31,
    latestConfirmedNonce: 30,
    network: Network.mainnet,
  });
  const updatedNonceSecondTime = getNonce({
    address: TEST_ADDRESS_1,
    network: Network.mainnet,
  });
  expect(updatedNonceSecondTime?.currentNonce).toStrictEqual(31);
  expect(updatedNonceSecondTime?.latestConfirmedNonce).toStrictEqual(30);
});
