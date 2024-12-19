import { Address } from 'viem';

import { Network, ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '../internal/createRainbowStore';

const chainsIdByNetwork: Record<Network, ChainId> = {
  [Network.apechain]: ChainId.apechain,
  [Network.mainnet]: ChainId.mainnet,
  [Network.polygon]: ChainId.polygon,
  [Network.avalanche]: ChainId.avalanche,
  [Network.bsc]: ChainId.bsc,
  [Network.gravity]: ChainId.gravity,
  [Network.scroll]: ChainId.scroll,
  [Network.zksync]: ChainId.zksync,
  [Network.ink]: ChainId.ink,
  [Network.linea]: ChainId.linea,
  [Network.sanko]: ChainId.sanko,
  [Network.arbitrum]: ChainId.arbitrum,
  [Network.optimism]: ChainId.optimism,
  [Network.zora]: ChainId.zora,
  [Network.base]: ChainId.base,
  [Network.degen]: ChainId.degen,
  [Network.gnosis]: ChainId.gnosis,
  [Network.blast]: ChainId.blast,
  [Network.goerli]: ChainId.goerli,
};

export interface AppSessionV0 {
  activeSessionAddress: Address;
  host: string;
  sessions: Record<Address, Network>;
  url: string;
}

export interface AppSession {
  activeSessionAddress: Address;
  host: string;
  sessions: Record<Address, ChainId>;
  url: string;
}

export interface AppSessionsStore<T extends AppSession | AppSessionV0> {
  appSessions: Record<string, T>;
  getActiveSession: ({ host }: { host: string }) => AppSession;
  removeAddressSessions: ({ address }: { address: Address }) => void;
  addSession: ({ host, address, chainId, url }: { host: string; address: Address; chainId: ChainId; url: string }) => void;
  removeSession: ({ host, address }: { host: string; address: Address }) => { address: Address; chainId: ChainId } | null;
  removeAppSession: ({ host }: { host: string }) => void;
  updateActiveSession: ({ host, address }: { host: string; address: Address }) => void;
  updateActiveSessionNetwork: ({ host, chainId }: { host: string; chainId: ChainId }) => void;
  updateSessionNetwork: ({ address, host, chainId }: { address: Address; host: string; chainId: ChainId }) => void;
  clearSessions: () => void;
}

export const useAppSessionsStore = createRainbowStore<AppSessionsStore<AppSession>>(
  (set, get) => ({
    appSessions: {},
    cachedSelectors: {},
    getActiveSession: ({ host }: { host: string }) => {
      const appSessions = get().appSessions;
      const sessionInfo = appSessions[host];
      return sessionInfo;
    },
    removeAddressSessions: ({ address }) => {
      const appSessions = get().appSessions;
      for (const [host, session] of Object.entries(appSessions)) {
        if (!session.sessions[address]) continue;
        delete appSessions[host].sessions[address];
        if (session.activeSessionAddress !== address) continue;
        const newActiveSessionAddress = Object.keys(session.sessions)[0];
        if (newActiveSessionAddress) {
          appSessions[host].activeSessionAddress = newActiveSessionAddress as Address;
        } else {
          delete appSessions[host];
        }
      }
      set({ appSessions: { ...appSessions } });
    },
    addSession: ({ host, address, chainId, url }) => {
      const appSessions = get().appSessions;
      const existingSession = appSessions[host];
      if (!existingSession || !existingSession.sessions) {
        appSessions[host] = {
          host,
          sessions: { [address]: chainId },
          activeSessionAddress: address,
          url,
        };
      } else {
        appSessions[host].sessions[address] = chainId;
        appSessions[host].activeSessionAddress = address;
      }
      set({
        appSessions: {
          ...appSessions,
        },
      });
    },
    removeAppSession: ({ host }) => {
      const appSessions = get().appSessions;
      delete appSessions[host];
      set({
        appSessions: {
          ...appSessions,
        },
      });
    },
    removeSession: ({ host, address }) => {
      const appSessions = get().appSessions;
      const appSession = appSessions[host];
      let newActiveSession = null;
      if (appSession?.sessions && Object.keys(appSession.sessions).length === 1) {
        delete appSessions[host];
        set({
          appSessions: {
            ...appSessions,
          },
        });
      } else if (appSession?.sessions) {
        delete appSession.sessions[address];
        const newActiveSessionAddress = Object.keys(appSession.sessions)[0] as Address;
        appSession.activeSessionAddress = newActiveSessionAddress;
        newActiveSession = {
          address: newActiveSessionAddress,
          chainId: appSession.sessions[newActiveSessionAddress],
        };
        set({
          appSessions: {
            ...appSessions,
            [host]: {
              ...appSession,
            },
          },
        });
      }

      return newActiveSession;
    },
    updateActiveSession: ({ host, address }) => {
      const appSessions = get().appSessions;
      const appSession = appSessions[host] || {};
      set({
        appSessions: {
          ...appSessions,
          [host]: {
            ...appSession,
            activeSessionAddress: address,
          },
        },
      });
    },
    updateActiveSessionNetwork: ({ host, chainId }) => {
      const appSessions = get().appSessions;
      const appSession = appSessions[host] || {};
      set({
        appSessions: {
          ...appSessions,
          [host]: {
            ...appSession,
            sessions: {
              ...appSession.sessions,
              [appSession.activeSessionAddress]: chainId,
            },
          },
        },
      });
    },
    updateSessionNetwork: ({ host, address, chainId }) => {
      const appSessions = get().appSessions;
      const appSession = appSessions[host];
      if (!appSession) return;
      set({
        appSessions: {
          ...appSessions,
          [host]: {
            ...appSession,
            sessions: {
              ...appSession.sessions,
              [address]: chainId,
            },
          },
        },
      });
    },
    clearSessions: () => set({ appSessions: {} }),
  }),
  {
    storageKey: 'appSessions',
    version: 1,
    migrate: (persistedState: unknown, version: number) => {
      if (version === 0) {
        const oldState = persistedState as AppSessionsStore<AppSessionV0>;
        const appSessions: AppSessionsStore<AppSession>['appSessions'] = {};
        for (const [host, session] of Object.entries(oldState.appSessions)) {
          const sessions = session.sessions;
          const newSessions = Object.keys(sessions).reduce(
            (acc, addr) => {
              const address = addr as Address;
              const network = sessions[address];
              acc[address] = chainsIdByNetwork[network];
              return acc as Record<Address, ChainId>;
            },
            {} as Record<Address, ChainId>
          );
          appSessions[host] = {
            activeSessionAddress: session.activeSessionAddress,
            host: session.host,
            sessions: newSessions,
            url: session.url,
          };
        }
        return {
          ...oldState,
          appSessions,
        };
      }
      return persistedState as AppSessionsStore<AppSession>;
    },
  }
);
