import walletTypes from '@/helpers/walletTypes';
import { AllRainbowWallets } from '@/model/wallet';
import { isLowerCaseMatch } from '@/utils';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';
import { Address } from 'viem';
import { useAccountAddress, useWalletAddresses, useWallets } from '@/state/wallets/walletsStore';
import { getWalletSummary } from '@/state/wallets/useWalletSummaryStore';

const getWalletForAddress = (wallets: AllRainbowWallets | null, address: string) => {
  return Object.values(wallets || {}).find(wallet => (wallet.addresses || []).some(addr => isLowerCaseMatch(addr.address, address)));
};

export const useFarcasterAccountForWallets = () => {
  const [farcasterWalletAddress, setFarcasterWalletAddress] = useState<Address | undefined>();
  const accountAddress = useAccountAddress();
  const wallets = useWallets();
  const allAddresses = useWalletAddresses();

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
