import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import { AppState } from '@rainbow-me/redux/store';
import { greaterThanOrEqualTo } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapIsSufficientBalance() {
  const inputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.inputCurrency?.address
  );
  const selectedGasPrice = useSelector(
    (state: AppState) => state.gas.selectedGasPrice
  );
  const inputAmount = useSelector(
    (state: AppState) => state.swap.inputAmount?.value
  );
  const type = useSelector((state: AppState) => state.swap.type);
  const supplyBalanceUnderlying = useSelector(
    (state: AppState) => state.swap.typeSpecificParameters?.supplyBalanceUnderlying
  );

  const maxInputBalance = useMemo(() => {
    return ethereumUtils.getBalanceAmount(
      selectedGasPrice,
      inputCurrencyAddress
    );
  }, [selectedGasPrice, inputCurrencyAddress]);

  const isSufficientBalance = useMemo(() => {
    if (!inputAmount) return true;

    const isWithdrawal = type === ExchangeModalTypes.withdrawal;

    return isWithdrawal
      ? greaterThanOrEqualTo(supplyBalanceUnderlying, inputAmount)
      : greaterThanOrEqualTo(maxInputBalance, inputAmount);
  }, [inputAmount, maxInputBalance, supplyBalanceUnderlying, type]);

  return {
    isSufficientBalance,
    maxInputBalance,
  };
}
