import { useCallback } from 'react';

import { analytics } from '@/analytics';
import { useAddCashRoute } from '@/features/cash/navigation/useAddCashRoute';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';
import Routes from '@/navigation/routesNames';
import { getIsDamagedWallet } from '@/state/wallets/walletsStore';

/**
 * Shared Add Cash entry point for the wallet row and the half sheet, so both stay in sync on
 * the damaged-wallet redirect and analytics category.
 */
export function useCashBalanceAddPress(category: string) {
  const navigate = useNavigationForNonReadOnlyWallets();
  const { route: addCashRoute } = useAddCashRoute();

  return useCallback(() => {
    if (getIsDamagedWallet()) {
      navigate(Routes.WALLET_ERROR_SHEET);
      return;
    }
    navigate(addCashRoute);
    analytics.track(analytics.event.navigationAddCash, { category });
  }, [addCashRoute, category, navigate]);
}
