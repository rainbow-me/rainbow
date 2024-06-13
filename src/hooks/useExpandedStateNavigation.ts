import { useCallback, useMemo } from 'react';
import { InteractionManager } from 'react-native';

import useWallets from './useWallets';
import { enableActionsOnReadOnlyWallet } from '@/config';
import AssetInputTypes from '@/helpers/assetInputTypes';
import { useNavigation } from '@/navigation';
import { watchingAlert } from '@/utils';
import { RainbowToken } from '@/entities';

export default function useExpandedStateNavigation(
  inputType: (typeof AssetInputTypes)[keyof typeof AssetInputTypes] | null,
  fromDiscover = false,
  asset: RainbowToken
) {
  const { goBack, navigate } = useNavigation();
  const { isReadOnlyWallet } = useWallets();

  const navigationPayload = useMemo(() => {
    switch (inputType) {
      case AssetInputTypes.in:
        return {
          fromDiscover,
          inputAsset: asset,
        };
      case AssetInputTypes.out:
        return {
          fromDiscover,
          outputAsset: asset,
        };
      default:
        return { asset };
    }
  }, [asset, fromDiscover, inputType]);

  return useCallback(
    (routeName: string, traverseParams: any) => {
      if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        return;
      }

      InteractionManager.runAfterInteractions(goBack);
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => navigate(routeName, traverseParams(navigationPayload)), 50);
      });
    },
    [goBack, isReadOnlyWallet, navigate, navigationPayload]
  );
}
