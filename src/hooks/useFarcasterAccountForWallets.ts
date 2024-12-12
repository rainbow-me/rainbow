import { queryClient } from '@/react-query';
import useWallets from './useWallets';
import { useEffect, useMemo, useState } from 'react';
import { addysSummaryQueryKey, useAddysSummary } from '@/resources/summary/summary';
import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';
import store from '@/redux/store';
import { isEmpty } from 'lodash';
import walletTypes from '@/helpers/walletTypes';

type SummaryData = ReturnType<typeof useAddysSummary>['data'];

export const useFarcasterWalletAddress = () => {
  const [farcasterWalletAddress, setFarcasterWalletAddress] = useState<string | null>(null);
  const { accountAddress } = useAccountSettings();
  const { wallets } = useWallets();

  const allAddresses = useMemo(
    () => Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address)),
    [wallets]
  );

  useEffect(() => {
    const summaryData = queryClient.getQueryData<SummaryData>(
      addysSummaryQueryKey({
        addresses: allAddresses,
        currency: store.getState().settings.nativeCurrency,
      })
    );
    if (isEmpty(summaryData?.data.addresses) || isEmpty(wallets)) {
      setFarcasterWalletAddress(null);
      return;
    }

    const selectedAddressFid = summaryData?.data.addresses[accountAddress as Address]?.meta?.farcaster?.fid;
    if (selectedAddressFid && (wallets || {})[accountAddress]?.type !== walletTypes.readOnly) {
      setFarcasterWalletAddress(accountAddress);
    }

    const farcasterWalletAddress = Object.keys(summaryData?.data.addresses || {}).find(addr => {
      const address = addr as Address;
      const faracsterId = summaryData?.data.addresses[address]?.meta?.farcaster?.fid;
      if (faracsterId && (wallets || {})[address]?.type !== walletTypes.readOnly) {
        return faracsterId;
      }
    });

    if (farcasterWalletAddress) {
      setFarcasterWalletAddress(farcasterWalletAddress);
    }
  }, [wallets, allAddresses, accountAddress]);

  return farcasterWalletAddress;
};
