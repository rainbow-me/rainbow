import { useRoute } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import useAsset from './useAsset';
import useWallets from './useWallets';
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config';
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
import { useNavigation } from '@rainbow-me/navigation';
import { watchingAlert } from '@rainbow-me/utils';

export default function useExpandedStateNavigation(
  inputType: typeof AssetInputTypes[keyof typeof AssetInputTypes],
  fromDiscover = false
) {
  const { goBack, navigate } = useNavigation();
  const { params } = useRoute();
  const { isReadOnlyWallet } = useWallets();

  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const asset = useAsset(params.asset);

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
    (routeName, traverseParams) => {
      if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        return;
      }

      InteractionManager.runAfterInteractions(goBack);
      InteractionManager.runAfterInteractions(() => {
        setTimeout(
          () => navigate(routeName, traverseParams(navigationPayload)),
          50
        );
      });
    },
    [goBack, isReadOnlyWallet, navigate, navigationPayload]
  );
}
