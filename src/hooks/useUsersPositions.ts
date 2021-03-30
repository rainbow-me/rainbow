import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { AppState } from '@rainbow-me/redux/store';
import { StoredPositions } from '@rainbow-me/redux/usersPositions';

export function useUsersPositions(): StoredPositions {
  const { accountAddress } = useAccountSettings();

  return useSelector((state: AppState) => state.usersPositions)[accountAddress];
}
