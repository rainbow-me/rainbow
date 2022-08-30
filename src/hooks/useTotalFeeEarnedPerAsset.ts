import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { AppState } from '@/redux/store';
import { UniswapPosition } from '@/redux/usersPositions';

export default function useTotalFeeEarnedPerAsset(
  address: string
): number | undefined {
  const { accountAddress } = useAccountSettings();
  const positions: UniswapPosition[] = useSelector(
    (state: AppState) => state.usersPositions
  )[accountAddress];

  const fee = positions?.find(
    ({ pair: { id } }) => id === address.toLowerCase()
  )?.fees?.sum;
  const rate = useNativeCurrencyToUSD();
  return fee && fee * rate;
}
