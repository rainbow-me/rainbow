import { useMemo } from 'react';
import { useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
import { ExchangeModalTypes } from '@rainbow-me/helpers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import { AppState } from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { greaterThanOrEqualTo } from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapIsSufficientBalance(inputAmount: string | null) {
  const inputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.inputCurrency?.address
  );
  const assets = useSelector((state: AppState) => state.data.assets);
  const type = useSelector((state: AppState) => state.swap.type);
  const supplyBalanceUnderlying = useSelector(
    (state: AppState) =>
      state.swap.typeSpecificParameters?.supplyBalanceUnderlying
  );

  const isSufficientBalance = useMemo(() => {
    if (!inputAmount) return true;

    const maxInputBalance =
      ethereumUtils.getAsset(assets, inputCurrencyAddress)?.balance?.amount ??
      0;

    const isWithdrawal = type === ExchangeModalTypes.withdrawal;

    return isWithdrawal
      ? greaterThanOrEqualTo(supplyBalanceUnderlying, inputAmount)
      : greaterThanOrEqualTo(maxInputBalance, inputAmount);
  }, [
    assets,
    inputAmount,
    inputCurrencyAddress,
    supplyBalanceUnderlying,
    type,
  ]);

  return isSufficientBalance;
}
