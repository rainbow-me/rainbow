import { useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import { AppState } from '@rainbow-me/redux/store';

export default function useTopMovers() {
  return useSelector((state: AppState) => state.topMovers);
}
