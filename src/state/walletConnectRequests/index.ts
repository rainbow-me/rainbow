import { WalletconnectRequestData } from '@/walletConnect/types';
import { createStore } from '../internal/createStore';
import { omitFlatten } from '@/helpers/utilities';
import create from 'zustand';

interface RequestsState {
  [requestId: number]: WalletconnectRequestData;
}

export interface WalletConnectRequestsState {
  walletConnectRequests: RequestsState;
  addWalletConnectRequest: ({ walletConnectRequest }: { walletConnectRequest: WalletconnectRequestData }) => boolean;
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
    addWalletConnectRequest: ({ walletConnectRequest }) => {
      const { walletConnectRequests: currentWalletConnectRequests } = get();
      const requestAlreadyExists = currentWalletConnectRequests[walletConnectRequest.requestId];
      if (requestAlreadyExists) return false;
      set({
        walletConnectRequests: {
          ...currentWalletConnectRequests,
          [walletConnectRequest.requestId]: walletConnectRequest,
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

export const addNewWalletConnectRequest = ({ walletConnectRequest }: { walletConnectRequest: WalletconnectRequestData }): boolean => {
  const { addWalletConnectRequest } = walletConnectRequestsStore.getState();
  return addWalletConnectRequest({ walletConnectRequest });
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
