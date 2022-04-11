import { useDispatch } from 'react-redux';
import { useAccountSettings } from '.';
import { removeExpiredRegistrations } from '@rainbow-me/redux/ensRegistration';

export default function useENSRefreshRegistrations() {
  const { accountAddress } = useAccountSettings();
  const dispatch = useDispatch();

  dispatch(removeExpiredRegistrations(accountAddress));
}
