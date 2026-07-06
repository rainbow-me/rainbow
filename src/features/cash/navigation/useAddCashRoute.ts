import { useCashDepositSetupStatusStore } from '@/features/cash/stores/cashDepositSetupStore';

import { useIsCashEnabled } from '../hooks/useIsCashEnabled';
import { getAddCashRoute } from './getAddCashRoute';

/**
 * The Add Cash entry point: the `route` to open (given the cash flag and the member's setup
 * status) plus `isCashEnabled`, so a call site can both route and label its button from one
 * flag subscription.
 */
export function useAddCashRoute() {
  const isCashEnabled = useIsCashEnabled();
  const setupStatus = useCashDepositSetupStatusStore();
  return { route: getAddCashRoute(isCashEnabled, setupStatus), isCashEnabled };
}
