import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import { AppState } from '@rainbow-me/redux/store';
import { greaterThanOrEqualTo } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapIsSufficientBalance(inputAmount: string | null) {
  const inputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.inputCurrency?.address
  );
  const type = useSelector((state: AppState) => state.swap.type);
  const supplyBalanceUnderlying = useSelector(
    (state: AppState) =>
      state.swap.typeSpecificParameters?.supplyBalanceUnderlying
  );

  const isSufficientBalance = useMemo(() => {
    if (!inputAmount) return true;

    const maxInputBalance =
      ethereumUtils.getAccountAsset(inputCurrencyAddress)?.balance?.amount ?? 0;

    const isWithdrawal = type === ExchangeModalTypes.withdrawal;

    return isWithdrawal
      ? greaterThanOrEqualTo(supplyBalanceUnderlying, inputAmount)
      : greaterThanOrEqualTo(maxInputBalance, inputAmount);
  }, [inputAmount, inputCurrencyAddress, supplyBalanceUnderlying, type]);

  return isSufficientBalance;
}
