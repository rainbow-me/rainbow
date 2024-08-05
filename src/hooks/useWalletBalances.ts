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

type WalletBalanceWithPositions = {
  assetBalanceAmount: number;
  assetBalanceDisplay: string;
  positionsBalanceAmount: string | number;
  positionsBalanceDisplay: string;
  totalBalanceAmount: string | number;
  totalBalanceDisplay: string;
};

type WalletBalanceWithoutPositions = Omit<WalletBalanceWithPositions, 'positionsBalanceAmount' | 'positionsBalanceDisplay'>;

type WalletBalanceResult<T extends boolean> = {
  balances: Record<Address, T extends true ? WalletBalanceWithPositions : WalletBalanceWithoutPositions>;
  isLoading: boolean;
};

const useWalletBalances = <T extends boolean = true>(wallets: AllRainbowWallets, withPositions: T = true as T): WalletBalanceResult<T> => {
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
      enabled: !!address && (withPositions as boolean),
    })),
  });

  const balancesWithPositions = useMemo(() => {
    const result: Record<Address, WalletBalanceWithPositions | WalletBalanceWithoutPositions> = {};

    for (const address of allAddresses) {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const assetBalance = summaryData?.data?.addresses?.[lowerCaseAddress]?.summary?.asset_value || 0;

      if (!withPositions) {
        result[lowerCaseAddress] = {
          assetBalanceAmount: assetBalance,
          assetBalanceDisplay: convertAmountToNativeDisplay(assetBalance, nativeCurrency),
          totalBalanceAmount: assetBalance,
          totalBalanceDisplay: convertAmountToNativeDisplay(assetBalance, nativeCurrency),
        };
      } else {
        const positionData = queryClient.getQueryData<RainbowPositions | undefined>(
          positionsQueryKey({ address, currency: nativeCurrency })
        );
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
    }

    return result;
  }, [allAddresses, summaryData, withPositions, nativeCurrency]);

  const isLoading = isSummaryLoading || positionQueries.some(query => query.isLoading);

  return {
    balances: balancesWithPositions as WalletBalanceResult<T>['balances'],
    isLoading,
  };
};

export default useWalletBalances;
