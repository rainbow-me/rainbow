import walletTypes from '@/helpers/walletTypes';
import { AllRainbowWallets } from '@/model/wallet';
import { queryClient } from '@/react-query';
import store from '@/redux/store';
import { AddysSummary, addysSummaryQueryKey } from '@/resources/summary/summary';
import { isLowerCaseMatch } from '@/utils';
import { isEmpty } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { Address } from 'viem';
import { useAccountAddress, useWallets } from '@/state/wallets/walletsStore';

const getWalletForAddress = (wallets: AllRainbowWallets | null, address: string) => {
  return Object.values(wallets || {}).find(wallet => (wallet.addresses || []).some(addr => isLowerCaseMatch(addr.address, address)));
};

export const useFarcasterAccountForWallets = () => {
  const [farcasterWalletAddress, setFarcasterWalletAddress] = useState<Address | undefined>();
  const accountAddress = useAccountAddress();
  const wallets = useWallets();

  const allAddresses = useMemo(
    () => Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address)),
    [wallets]
  );

  useEffect(() => {
    const summaryData = queryClient.getQueryData<AddysSummary>(
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
