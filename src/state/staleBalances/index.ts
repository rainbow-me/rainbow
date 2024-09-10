import { createRainbowStore } from '../internal/createRainbowStore';

const TIME_TO_WATCH = 600000;

interface StaleBalanceInfo {
  address: string;
  expirationTime?: number;
  transactionHash: string;
}

interface StaleBalances {
  [key: string]: StaleBalanceInfo;
}
interface StaleBalancesByChainId {
  [key: number]: StaleBalances;
}

export interface StaleBalancesState {
  addStaleBalance: ({ address, chainId, info }: { address: string; chainId: number; info: StaleBalanceInfo }) => void;
  clearExpiredData: (address: string) => void;
  getStaleBalancesQueryParam: (address: string) => string;
  staleBalances: Record<string, StaleBalancesByChainId>;
}

export const staleBalancesStore = createRainbowStore<StaleBalancesState>(
  (set, get) => ({
    addStaleBalance: ({ address, chainId, info }: { address: string; chainId: number; info: StaleBalanceInfo }) => {
      set(state => {
        const { staleBalances } = state;
        const staleBalancesForUser = staleBalances[address] || {};
        const staleBalancesForChain = staleBalancesForUser[chainId] || {};
        const newStaleBalancesForChain = {
          ...staleBalancesForChain,
          [info.address]: {
            ...info,
            expirationTime: info.expirationTime || Date.now() + TIME_TO_WATCH,
          },
        };
        const newStaleBalancesForUser = {
          ...staleBalancesForUser,
          [chainId]: newStaleBalancesForChain,
        };
        return {
          staleBalances: {
            ...staleBalances,
            [address]: newStaleBalancesForUser,
          },
        };
      });
    },
    clearExpiredData: (address: string) => {
      set(state => {
        const { staleBalances } = state;
        const staleBalancesForUser = staleBalances[address] || {};
        const newStaleBalancesForUser: StaleBalancesByChainId = {
          ...staleBalancesForUser,
        };
        for (const c of Object.keys(staleBalancesForUser)) {
          const chainId = parseInt(c, 10);
          const newStaleBalancesForChain = {
            ...(staleBalancesForUser[chainId] || {}),
          };
          for (const staleBalance of Object.values(newStaleBalancesForChain)) {
            if (typeof staleBalance.expirationTime === 'number' && staleBalance.expirationTime <= Date.now()) {
              delete newStaleBalancesForChain[staleBalance.address];
            }
          }
          newStaleBalancesForUser[chainId] = newStaleBalancesForChain;
        }
        return {
          staleBalances: {
            ...staleBalances,
            [address]: newStaleBalancesForUser,
          },
        };
      });
    },
    getStaleBalancesQueryParam: (address: string) => {
      let queryStringFragment = '';
      const { staleBalances } = get();
      const staleBalancesForUser = staleBalances[address];
      for (const c of Object.keys(staleBalancesForUser)) {
        const chainId = parseInt(c, 10);
        const staleBalancesForChain = staleBalancesForUser[chainId];
        for (const staleBalance of Object.values(staleBalancesForChain)) {
          if (typeof staleBalance.expirationTime === 'number') {
            queryStringFragment += `&token=${chainId}.${staleBalance.address}`;
          }
        }
      }
      return queryStringFragment;
    },
    staleBalances: {},
  }),
  {
    storageKey: 'staleBalances',
    version: 0,
  }
);
