import { WalletconnectRequestData } from '@/walletConnect/types';
import { createStore } from '../internal/createStore';
import { omitFlatten } from '@/helpers/utilities';
import create from 'zustand';

interface RequestsState {
  [requestId: number]: WalletconnectRequestData;
}

export interface WalletConnectRequestsState {
  walletConnectRequests: Record<string, RequestsState>;
  addWalletConnectRequest: ({
    accountAddress,
    walletConnectRequest,
  }: {
    accountAddress: string;
    walletConnectRequest: WalletconnectRequestData;
  }) => boolean;
  removeWalletConnectRequest: ({
    accountAddress,
    walletConnectRequestId,
  }: {
    accountAddress: string;
    walletConnectRequestId: number;
  }) => void;
}

export const walletConnectRequestsStore = createStore<WalletConnectRequestsState>(
  (set, get) => ({
    walletConnectRequests: {},
    addWalletConnectRequest: ({ accountAddress, walletConnectRequest }) => {
      const { walletConnectRequests: currentWalletConnectRequests } = get();
      const addressWalletConnectRequests = currentWalletConnectRequests[accountAddress] || {};
      const requestAlreadyExists = addressWalletConnectRequests[walletConnectRequest.requestId];
      if (requestAlreadyExists) return false;
      set({
        walletConnectRequests: {
          ...currentWalletConnectRequests,
          [accountAddress]: {
            ...addressWalletConnectRequests,
            [walletConnectRequest.requestId]: walletConnectRequest,
          },
        },
      });
      return true;
    },
    removeWalletConnectRequest: ({ accountAddress, walletConnectRequestId }) => {
      const { walletConnectRequests: currentWalletConnectRequests } = get();
      const addressWalletConnectRequests = currentWalletConnectRequests[accountAddress] || {};
      const updatedRequests = omitFlatten(addressWalletConnectRequests, [walletConnectRequestId]);
      set({
        walletConnectRequests: {
          ...currentWalletConnectRequests,
          [accountAddress]: {
            ...updatedRequests,
          },
        },
      });
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
  accountAddress,
  walletConnectRequest,
}: {
  accountAddress: string;
  walletConnectRequest: WalletconnectRequestData;
}): boolean => {
  const { addWalletConnectRequest } = walletConnectRequestsStore.getState();
  return addWalletConnectRequest({ accountAddress, walletConnectRequest });
};

export const removeWalletConnectRequest = ({
  accountAddress,
  walletConnectRequestId,
}: {
  accountAddress: string;
  walletConnectRequestId: number;
}): void => {
  const { removeWalletConnectRequest: removeWCRequest } = walletConnectRequestsStore.getState();
  removeWCRequest({ accountAddress, walletConnectRequestId });
};
