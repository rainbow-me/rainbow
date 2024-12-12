import { queryClient } from '@/react-query';
import useWallets from './useWallets';
import { useEffect, useMemo, useState } from 'react';
import { addysSummaryQueryKey, useAddysSummary } from '@/resources/summary/summary';
import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';
import store from '@/redux/store';
import { isEmpty } from 'lodash';
import walletTypes from '@/helpers/walletTypes';
import { isLowerCaseMatch } from '@/utils';
import { AllRainbowWallets } from '@/model/wallet';

type SummaryData = ReturnType<typeof useAddysSummary>['data'];

const getWalletForAddress = (wallets: AllRainbowWallets, address: string) => {
  return Object.values(wallets || {}).find(wallet => wallet.addresses.some(addr => isLowerCaseMatch(addr.address, address)));
};

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

    if (selectedAddressFid && getWalletForAddress(wallets || {}, accountAddress)?.type !== walletTypes.readOnly) {
      setFarcasterWalletAddress(accountAddress);
      return;
    }

    const farcasterWalletAddress = Object.keys(summaryData?.data.addresses || {}).find(addr => {
      const address = addr as Address;
      const faracsterId = summaryData?.data.addresses[address]?.meta?.farcaster?.fid;
      if (faracsterId && getWalletForAddress(wallets || {}, address)?.type !== walletTypes.readOnly) {
        return faracsterId;
      }
    });

    if (farcasterWalletAddress) {
      setFarcasterWalletAddress(farcasterWalletAddress);
      return;
    }
    setFarcasterWalletAddress(null);
  }, [wallets, allAddresses, accountAddress]);

  console.log('farcasterWalletAddress', farcasterWalletAddress);

  return farcasterWalletAddress;
};
