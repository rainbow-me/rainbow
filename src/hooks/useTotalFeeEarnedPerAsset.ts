import { toLower } from 'lodash';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { AppState } from '@rainbow-me/redux/store';
import { UniswapPosition } from '@rainbow-me/redux/usersPositions';

export default function useTotalFeeEarnedPerAsset(
  address: string
): number | undefined {
  const { accountAddress } = useAccountSettings();
  const positions: UniswapPosition[] = useSelector(
    (state: AppState) => state.usersPositions
  )[accountAddress];

  const fee = positions?.find(({ pair: { id } }) => id === toLower(address))
    ?.fees?.sum;
  const rate = useNativeCurrencyToUSD();
  return fee && fee * rate;
}
