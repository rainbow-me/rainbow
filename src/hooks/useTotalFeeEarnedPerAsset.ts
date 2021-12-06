import { toLower } from 'lodash';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import { AppState } from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/usersPositio... Remove this comment to see the full error message
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
