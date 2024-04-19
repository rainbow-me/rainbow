import { AllRainbowWallets } from '@/model/wallet';
import { useMemo } from 'react';
import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';
import { useAddysSummary } from '@/resources/summary/summary';

const useWalletBalances = (wallets: AllRainbowWallets) => {
  const { nativeCurrency } = useAccountSettings();

  const walletAddresses: Address[] = useMemo(
    () => Object.values(wallets).flatMap(wallet => wallet.addresses.map(account => account.address as Address)),
    [wallets]
  );

  const { data, isLoading } = useAddysSummary({ addresses: walletAddresses, currency: nativeCurrency });

  return {
    balances: data?.data?.addresses,
    isLoading,
  };
};

export default useWalletBalances;
