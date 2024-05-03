import { Network } from '@/networks/types';
import { useAppSessionsStore } from '.';

const UNISWAP_HOST = 'uniswap.org';
const UNISWAP_URL = 'www.uniswap.org';
const OPENSEA_HOST = 'opensea.io';
const OPENSEA_URL = 'www.opensea.io';
const ADDRESS_1 = '0x123';
const ADDRESS_2 = '0x321';

test('should be able to add session', async () => {
  const { appSessions, addSession } = useAppSessionsStore.getState();
  expect(appSessions).toStrictEqual({});
  addSession({
    url: UNISWAP_URL,
    host: UNISWAP_HOST,
    address: ADDRESS_1,
    network: Network.mainnet,
  });
  expect(useAppSessionsStore.getState().appSessions).toStrictEqual({
    [UNISWAP_HOST]: {
      url: UNISWAP_URL,
      host: UNISWAP_HOST,
      sessions: { [ADDRESS_1]: Network.mainnet },
      activeSessionAddress: ADDRESS_1,
    },
  });
});

test('should be able to add session to an existent host', async () => {
  const { addSession } = useAppSessionsStore.getState();
  addSession({
    url: UNISWAP_URL,
    host: UNISWAP_HOST,
    address: ADDRESS_2,
    network: Network.arbitrum,
  });
  expect(useAppSessionsStore.getState().appSessions).toStrictEqual({
    [UNISWAP_HOST]: {
      url: UNISWAP_URL,
      host: UNISWAP_HOST,
      sessions: { [ADDRESS_1]: Network.mainnet, [ADDRESS_2]: Network.arbitrum },
      activeSessionAddress: ADDRESS_2,
    },
  });
});

test('should be able to add session to a new host', async () => {
  const { addSession } = useAppSessionsStore.getState();
  addSession({
    url: OPENSEA_URL,
    host: OPENSEA_HOST,
    address: ADDRESS_2,
    network: Network.arbitrum,
  });
  expect(useAppSessionsStore.getState().appSessions).toStrictEqual({
    [UNISWAP_HOST]: {
      url: UNISWAP_URL,
      host: UNISWAP_HOST,
      sessions: { [ADDRESS_1]: Network.mainnet, [ADDRESS_2]: Network.arbitrum },
      activeSessionAddress: ADDRESS_2,
    },
    [OPENSEA_HOST]: {
      url: OPENSEA_URL,
      host: OPENSEA_HOST,
      sessions: { [ADDRESS_2]: Network.arbitrum },
      activeSessionAddress: ADDRESS_2,
    },
  });
});

test('should be able to remove app session for a host', async () => {
  const { removeAppSession } = useAppSessionsStore.getState();
  removeAppSession({ host: OPENSEA_HOST });
  expect(useAppSessionsStore.getState().appSessions).toStrictEqual({
    [UNISWAP_HOST]: {
      url: UNISWAP_URL,
      host: UNISWAP_HOST,
      sessions: { [ADDRESS_1]: Network.mainnet, [ADDRESS_2]: Network.arbitrum },
      activeSessionAddress: ADDRESS_2,
    },
  });
});

test('should be able to remove a session for a host and address', async () => {
  const { removeSession } = useAppSessionsStore.getState();
  removeSession({ host: UNISWAP_HOST, address: ADDRESS_2 });
  expect(useAppSessionsStore.getState().appSessions).toStrictEqual({
    [UNISWAP_HOST]: {
      url: UNISWAP_URL,
      host: UNISWAP_HOST,
      sessions: { [ADDRESS_1]: Network.mainnet },
      activeSessionAddress: ADDRESS_1,
    },
  });
});

test('should be able to update active session', async () => {
  const { addSession, updateActiveSession } = useAppSessionsStore.getState();
  addSession({
    url: UNISWAP_URL,
    host: UNISWAP_HOST,
    address: ADDRESS_2,
    network: Network.arbitrum,
  });
  updateActiveSession({ host: UNISWAP_HOST, address: ADDRESS_1 });
  expect(useAppSessionsStore.getState().appSessions[UNISWAP_HOST].activeSessionAddress).toStrictEqual(ADDRESS_1);
});

test('should be able to update active session network', async () => {
  const { updateActiveSessionNetwork } = useAppSessionsStore.getState();

  updateActiveSessionNetwork({ host: UNISWAP_HOST, network: Network.base });
  const activeSessionAddress = useAppSessionsStore.getState().appSessions[UNISWAP_HOST].activeSessionAddress;
  expect(useAppSessionsStore.getState().appSessions[UNISWAP_HOST].sessions[activeSessionAddress]).toStrictEqual(Network.base);
});

test('should be able to update session network', async () => {
  const { updateSessionNetwork } = useAppSessionsStore.getState();

  updateSessionNetwork({
    host: UNISWAP_HOST,
    address: ADDRESS_1,
    network: Network.zora,
  });
  expect(useAppSessionsStore.getState().appSessions[UNISWAP_HOST].sessions[ADDRESS_1]).toStrictEqual(Network.zora);
});

test('should be able to clear all sessions', async () => {
  const { clearSessions } = useAppSessionsStore.getState();
  clearSessions();
  expect(useAppSessionsStore.getState().appSessions).toStrictEqual({});
});

test('should be able to check if host has an active session', async () => {
  const { addSession, getActiveSession } = useAppSessionsStore.getState();
  expect(useAppSessionsStore.getState().appSessions).toStrictEqual({});
  addSession({
    url: UNISWAP_URL,
    host: UNISWAP_HOST,
    address: ADDRESS_1,
    network: Network.mainnet,
  });
  const activeSession = getActiveSession({ host: UNISWAP_HOST });
  expect(activeSession).toStrictEqual({
    address: ADDRESS_1,
    network: Network.mainnet,
  });
});

test('should be able to update session chain id', async () => {
  const { updateSessionNetwork } = useAppSessionsStore.getState();
  updateSessionNetwork({
    host: UNISWAP_HOST,
    address: ADDRESS_1,
    network: Network.arbitrum,
  });
  expect(useAppSessionsStore.getState().appSessions).toStrictEqual({
    [UNISWAP_HOST]: {
      url: UNISWAP_URL,
      host: UNISWAP_HOST,
      sessions: { [ADDRESS_1]: Network.arbitrum },
      activeSessionAddress: ADDRESS_1,
    },
  });
});
