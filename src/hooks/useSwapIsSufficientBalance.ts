import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ExchangeModalTypes } from '@/helpers';
import { AppState } from '@/redux/store';
import { greaterThanOrEqualTo } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapIsSufficientBalance(inputAmount: string | null) {
  const inputCurrencyUniqueId = useSelector(
    (state: AppState) => state.swap.inputCurrency?.uniqueId
  );
  const type = useSelector((state: AppState) => state.swap.type);
  const supplyBalanceUnderlying = useSelector(
    (state: AppState) =>
      state.swap.typeSpecificParameters?.supplyBalanceUnderlying
  );

  const isSufficientBalance = useMemo(() => {
    if (!inputAmount) return true;
    const maxInputBalance =
      ethereumUtils.getAccountAsset(inputCurrencyUniqueId)?.balance?.amount ??
      0;
    const isWithdrawal = type === ExchangeModalTypes.withdrawal;

    return isWithdrawal
      ? greaterThanOrEqualTo(supplyBalanceUnderlying, inputAmount)
      : greaterThanOrEqualTo(maxInputBalance, inputAmount);
  }, [inputAmount, inputCurrencyUniqueId, supplyBalanceUnderlying, type]);

  return isSufficientBalance;
}
