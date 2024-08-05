import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';
import { useAddysSummary } from '@/resources/summary/summary';
import { usePositions } from '@/resources/defi/PositionsQuery';
import { add, convertAmountToNativeDisplay } from '@/helpers/utilities';

const useAccountBalance = (address: Address) => {
  const { nativeCurrency } = useAccountSettings();

  const lowerCaseAddress = address.toLowerCase() as Address;

  const { data: summaryData, isLoading: isSummaryLoading } = useAddysSummary({ addresses: [lowerCaseAddress], currency: nativeCurrency });
  const { data: positionsData, isLoading: isPositionsLoading } = usePositions({ address: lowerCaseAddress, currency: nativeCurrency });

  const assetBalance = summaryData?.data?.addresses?.[lowerCaseAddress]?.summary?.asset_value || 0;
  const positionsBalance = positionsData?.totals?.total?.amount || '0';
  const totalBalance = add(assetBalance, positionsBalance);

  return {
    assetBalanceAmount: assetBalance,
    assetBalanceDisplay: convertAmountToNativeDisplay(assetBalance, nativeCurrency),
    positionsBalanceAmount: positionsBalance,
    positionsBalanceDisplay: convertAmountToNativeDisplay(positionsBalance, nativeCurrency),
    totalBalanceAmount: totalBalance,
    totalBalanceDisplay: convertAmountToNativeDisplay(totalBalance, nativeCurrency),
    isLoading: isSummaryLoading || isPositionsLoading,
  };
};

export default useAccountBalance;
