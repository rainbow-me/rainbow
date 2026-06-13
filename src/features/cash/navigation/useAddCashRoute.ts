import { useIsCashEnabled } from '@/features/cash/hooks/useIsCashEnabled';
import { getAddCashRoute } from '@/features/cash/navigation/getAddCashRoute';
import { useCashDepositSetupStatus } from '@/features/cash/stores/cashDepositSetupStore';

/**
 * The Add Cash entry point: the `route` to open (given the cash flag and the member's setup
 * status) plus `isCashEnabled`, so a call site can both route and label its button from one
 * flag subscription.
 */
export function useAddCashRoute() {
  const isCashEnabled = useIsCashEnabled();
  const setupStatus = useCashDepositSetupStatus();
  return { route: getAddCashRoute(isCashEnabled, setupStatus), isCashEnabled };
}
