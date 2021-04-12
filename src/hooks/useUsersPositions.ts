import { toLower } from 'lodash';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { AppState } from '@rainbow-me/redux/store';
import { StoredPositions } from '@rainbow-me/redux/usersPositions';

export function useUsersPositions(): StoredPositions[] {
  const { accountAddress } = useAccountSettings();

  return useSelector((state: AppState) => state.usersPositions)[accountAddress];
}

export function useTotalFeeEarnedPerAsset(address: string): number | undefined {
  const positions = useUsersPositions();
  const fee = positions?.find(({ pair: { id } }) => id === toLower(address))
    ?.fees?.sum;
  const rate = useNativeCurrencyToUSD();
  return fee && fee * rate;
}
