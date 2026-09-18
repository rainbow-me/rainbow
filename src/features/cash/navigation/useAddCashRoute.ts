import { useCashDepositSetupStatusStore } from '@/features/cash/stores/cashDepositSetupStore';
import { selectIsPhoneVerified, useCashSetupSessionStore } from '@/features/cash/stores/cashSetupSessionStore';

import { useIsCashEnabled } from '../hooks/useIsCashEnabled';
import { getAddCashRoute } from './getAddCashRoute';

/**
 * The Add Cash entry point: the `route` to open (given the cash flag, the member's setup
 * status and a still-live phone verification) plus `isCashEnabled`, so a call site can both
 * route and label its button from one flag subscription.
 */
export function useAddCashRoute() {
  const isCashEnabled = useIsCashEnabled();
  const setupStatus = useCashDepositSetupStatusStore();
  const isPhoneVerified = useCashSetupSessionStore(selectIsPhoneVerified);
  return { route: getAddCashRoute(isCashEnabled, setupStatus, isPhoneVerified), isCashEnabled };
}
