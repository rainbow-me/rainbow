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

const getWalletForAddress = (wallets: AllRainbowWallets | null, address: string) => {
  return Object.values(wallets || {}).find(wallet => wallet.addresses.some(addr => isLowerCaseMatch(addr.address, address)));
};

export const useFarcasterAccountForWallets = () => {
  const [farcasterWalletAddress, setFarcasterWalletAddress] = useState<Address | undefined>();
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
    const addresses = summaryData?.data.addresses;

    if (!addresses || isEmpty(addresses) || isEmpty(wallets)) {
      setFarcasterWalletAddress(undefined);
      return;
    }

    const selectedAddressFid = addresses[accountAddress]?.meta?.farcaster?.fid;
    if (selectedAddressFid && getWalletForAddress(wallets, accountAddress)?.type !== walletTypes.readOnly) {
      setFarcasterWalletAddress(accountAddress);
      return;
    }

    const farcasterWalletAddress = Object.keys(addresses).find(addr => {
      const address = addr as Address;
      const faracsterId = summaryData?.data.addresses[address]?.meta?.farcaster?.fid;
      if (faracsterId && getWalletForAddress(wallets, address)?.type !== walletTypes.readOnly) {
        return address;
      }
    }) as Address | undefined;

    if (farcasterWalletAddress) {
      setFarcasterWalletAddress(farcasterWalletAddress);
      return;
    }
    setFarcasterWalletAddress(undefined);
  }, [wallets, allAddresses, accountAddress]);

  return farcasterWalletAddress;
};
