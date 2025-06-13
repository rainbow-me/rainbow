import walletTypes from '@/helpers/walletTypes';
import { AllRainbowWallets } from '@/model/wallet';
<<<<<<< HEAD
import { isLowerCaseMatch } from '@/utils';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';
import { Address } from 'viem';
import { useAccountAddress, useWalletAddresses, useWallets } from '@/state/wallets/walletsStore';
import { getWalletSummary } from '@/state/wallets/useWalletSummaryStore';
=======
import { queryClient } from '@/react-query';
import store from '@/redux/store';
import { addysSummaryQueryKey, useAddysSummary } from '@/resources/summary/summary';
import { isLowerCaseMatch } from '@/utils';
import { isEmpty } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { Address } from 'viem';
import { useAccountAddress, useWallets } from '@/state/wallets/walletsStore';

type SummaryData = ReturnType<typeof useAddysSummary>['data'];
>>>>>>> origin/develop

const getWalletForAddress = (wallets: AllRainbowWallets | null, address: string) => {
  return Object.values(wallets || {}).find(wallet => (wallet.addresses || []).some(addr => isLowerCaseMatch(addr.address, address)));
};

export const useFarcasterAccountForWallets = () => {
  const [farcasterWalletAddress, setFarcasterWalletAddress] = useState<Address | undefined>();
  const accountAddress = useAccountAddress();
  const wallets = useWallets();
<<<<<<< HEAD
  const allAddresses = useWalletAddresses();
=======

  const allAddresses = useMemo(
    () => Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address)),
    [wallets]
  );
>>>>>>> origin/develop

  useEffect(() => {
    const summaryData = getWalletSummary();
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
