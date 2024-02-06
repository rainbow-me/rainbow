import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { greaterThanOrEqualTo } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';

export default function useSwapIsSufficientBalance(inputAmount: string | null) {
  const inputCurrencyUniqueId = useSelector((state: AppState) => state.swap.inputCurrency?.uniqueId);
  const type = useSelector((state: AppState) => state.swap.type);

  const isSufficientBalance = useMemo(() => {
    if (!inputAmount) return true;
    const maxInputBalance = ethereumUtils.getAccountAsset(inputCurrencyUniqueId)?.balance?.amount ?? 0;
    return greaterThanOrEqualTo(maxInputBalance, inputAmount);
  }, [inputAmount, inputCurrencyUniqueId, type]);

  return isSufficientBalance;
}
