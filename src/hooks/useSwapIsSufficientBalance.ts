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
  const inputAmount = useSelector((state: AppState) => state.swap.inputAmount);
  const type = useSelector((state: AppState) => state.swap.type);
  const typeSpecificParameters = useSelector(
    (state: AppState) => state.swap.typeSpecificParameters
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
    const { supplyBalanceUnderlying } = typeSpecificParameters;

    return isWithdrawal
      ? greaterThanOrEqualTo(supplyBalanceUnderlying, inputAmount)
      : greaterThanOrEqualTo(maxInputBalance, inputAmount);
  }, [inputAmount, maxInputBalance, type, typeSpecificParameters]);

  return {
    isSufficientBalance,
    maxInputBalance,
  };
}
