import { useCallback } from 'react';
import { Platform } from 'react-native';

import type { ParsedAddressAsset, RainbowToken } from '@/entities/tokens';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';
import Routes from '@/navigation/routesNames';

/**
 * Shared Send entry point so every asset-detail surface (SendActionButton, the Cash Balance
 * half sheet, ...) dispatches the same iOS/Android route shape instead of re-deriving it.
 */
export function useNavigateToSend(asset: RainbowToken | UniqueAsset | ParsedAddressAsset | undefined) {
  const navigate = useNavigationForNonReadOnlyWallets();

  return useCallback(() => {
    if (!asset) return;
    if (Platform.OS === 'ios') {
      navigate(Routes.SEND_FLOW, { screen: Routes.SEND_SHEET, params: { asset } });
    } else {
      navigate(Routes.SEND_FLOW, { asset });
    }
  }, [asset, navigate]);
}
