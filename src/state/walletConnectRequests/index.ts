import { WalletconnectRequestData } from '@/walletConnect/types';
import { createStore } from '../internal/createStore';
import create from 'zustand';

interface RequestsState {
  [requestId: number]: WalletconnectRequestData;
}

export interface WalletConnectRequestsState {
  walletConnectRequests: Record<string, RequestsState>;
  addWalletConnectRequest: ({
    address,
    walletConnectRequest,
  }: {
    address: string;
    walletConnectRequest: WalletconnectRequestData;
  }) => boolean;
}

export const walletConnectRequestsStore = createStore<WalletConnectRequestsState>(
  (set, get) => ({
    walletConnectRequests: {},
    addWalletConnectRequest: ({ address, walletConnectRequest }) => {
      const { walletConnectRequests: currentWalletConnectRequests } = get();
      const addressWalletConnectRequests = currentWalletConnectRequests[address] || {};
      const requestAlreadyExists = addressWalletConnectRequests[walletConnectRequest.requestId];
      if (requestAlreadyExists) return false;
      set({
        walletConnectRequests: {
          ...currentWalletConnectRequests,
          [address]: {
            ...addressWalletConnectRequests,
            [walletConnectRequest.requestId]: walletConnectRequest,
          },
        },
      });
      return true;
    },
  }),
  {
    persist: {
      name: 'walletConnectRequests',
      version: 1,
    },
  }
);

export const useWalletConnectRequestsStore = create(walletConnectRequestsStore);

export const addNewWalletConnectRequest = ({
  address,
  walletConnectRequest,
}: {
  address: string;
  walletConnectRequest: WalletconnectRequestData;
}): boolean => {
  const { addWalletConnectRequest } = walletConnectRequestsStore.getState();
  return addWalletConnectRequest({ address, walletConnectRequest });
};
