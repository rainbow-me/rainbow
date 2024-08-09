import { AllRainbowWallets } from '@/model/wallet';
import { useMemo } from 'react';
import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';
import { useAddysSummary } from '@/resources/summary/summary';
import { useQueries } from '@tanstack/react-query';
import { fetchPositions, positionsQueryKey } from '@/resources/defi/PositionsQuery';
import { RainbowPositions } from '@/resources/defi/types';
import { add, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { queryClient } from '@/react-query';

type WalletBalance = {
  assetBalanceAmount: number;
  assetBalanceDisplay: string;
  positionsBalanceAmount: string | number;
  positionsBalanceDisplay: string;
  totalBalanceAmount: string | number;
  totalBalanceDisplay: string;
};

type WalletBalanceResult = {
  balances: Record<Address, WalletBalance>;
  isLoading: boolean;
};

const useWalletBalances = (wallets: AllRainbowWallets): WalletBalanceResult => {
  const { nativeCurrency } = useAccountSettings();

  const allAddresses = useMemo(
    () => Object.values(wallets).flatMap(wallet => wallet.addresses.map(account => account.address as Address)),
    [wallets]
  );

  const { data: summaryData, isLoading: isSummaryLoading } = useAddysSummary({
    addresses: allAddresses,
    currency: nativeCurrency,
  });

  const positionQueries = useQueries({
    queries: allAddresses.map(address => ({
      queryKey: positionsQueryKey({ address, currency: nativeCurrency }),
      queryFn: () => fetchPositions({ address, currency: nativeCurrency }),
      enabled: !!address,
    })),
  });

  const isLoading = isSummaryLoading || positionQueries.some(query => query.isLoading);

  const balances = useMemo(() => {
    const result: Record<Address, WalletBalance> = {};

    if (isLoading) return result;

    for (const address of allAddresses) {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const assetBalance = summaryData?.data?.addresses?.[lowerCaseAddress]?.summary?.asset_value || 0;

      const positionData = queryClient.getQueryData<RainbowPositions | undefined>(positionsQueryKey({ address, currency: nativeCurrency }));
      const positionsBalance = positionData?.totals?.total?.amount || '0';
      const totalAccountBalance = add(assetBalance, positionsBalance);

      result[lowerCaseAddress] = {
        assetBalanceAmount: assetBalance,
        assetBalanceDisplay: convertAmountToNativeDisplay(assetBalance, nativeCurrency),
        positionsBalanceAmount: positionsBalance,
        positionsBalanceDisplay: convertAmountToNativeDisplay(positionsBalance, nativeCurrency),
        totalBalanceAmount: totalAccountBalance,
        totalBalanceDisplay: convertAmountToNativeDisplay(totalAccountBalance, nativeCurrency),
      };
    }

    return result;
  }, [allAddresses, summaryData, nativeCurrency]);

  return {
    balances,
    isLoading,
  };
};

export default useWalletBalances;
