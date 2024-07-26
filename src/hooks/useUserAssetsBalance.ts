import { useMemo } from 'react';
import { add, convertAmountToNativeDisplay } from '@/helpers/utilities';
import useAccountSettings from './useAccountSettings';
import { userAssetsStore } from '@/state/assets/userAssets';

export function useUserAssetsBalance() {
  const { nativeCurrency } = useAccountSettings();
  const getUserAssets = userAssetsStore(state => state.getUserAssets);

  const amount = useMemo(() => {
    return getUserAssets().reduce((prev, curr) => add(prev, curr.balance.amount), '0');
  }, [getUserAssets]);

  return {
    amount,
    display: convertAmountToNativeDisplay(amount, nativeCurrency),
  };
}
