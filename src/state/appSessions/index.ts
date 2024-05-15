import { Address } from 'viem';

import { Network } from '@/networks/types';
import { createRainbowStore } from '../internal/createRainbowStore';

export interface AppSession {
  activeSessionAddress: Address;
  host: string;
  sessions: Record<Address, Network>;
  url: string;
}

export interface AppSessionsStore<T extends AppSession> {
  appSessions: Record<string, T>;
  getActiveSession: ({ host }: { host: string }) => AppSession;
  removeAddressSessions: ({ address }: { address: Address }) => void;
  addSession: ({ host, address, network, url }: { host: string; address: Address; network: Network; url: string }) => void;
  removeSession: ({ host, address }: { host: string; address: Address }) => { address: Address; network: Network } | null;
  removeAppSession: ({ host }: { host: string }) => void;
  updateActiveSession: ({ host, address }: { host: string; address: Address }) => void;
  updateActiveSessionNetwork: ({ host, network }: { host: string; network: Network }) => void;
  updateSessionNetwork: ({ address, host, network }: { address: Address; host: string; network: Network }) => void;
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
    addSession: ({ host, address, network, url }) => {
      const appSessions = get().appSessions;
      const existingSession = appSessions[host];
      if (!existingSession || !existingSession.sessions) {
        appSessions[host] = {
          host,
          sessions: { [address]: network },
          activeSessionAddress: address,
          url,
        };
      } else {
        appSessions[host].sessions[address] = network;
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
          network: appSession.sessions[newActiveSessionAddress],
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
    updateActiveSessionNetwork: ({ host, network }) => {
      const appSessions = get().appSessions;
      const appSession = appSessions[host] || {};
      set({
        appSessions: {
          ...appSessions,
          [host]: {
            ...appSession,
            sessions: {
              ...appSession.sessions,
              [appSession.activeSessionAddress]: network,
            },
          },
        },
      });
    },
    updateSessionNetwork: ({ host, address, network }) => {
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
              [address]: network,
            },
          },
        },
      });
    },
    clearSessions: () => set({ appSessions: {} }),
  }),
  {
    storageKey: 'appSessions',
    version: 0,
  }
);
