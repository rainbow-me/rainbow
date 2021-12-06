import { useRoute } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import useAsset from './useAsset';
import useWallets from './useWallets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/assetInput... Remove this comment to see the full error message
import AssetInputTypes from '@rainbow-me/helpers/assetInputTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { watchingAlert } from '@rainbow-me/utils';

export default function useExpandedStateNavigation(inputType: any) {
  const { goBack, navigate } = useNavigation();
  const { params } = useRoute();
  const { isReadOnlyWallet } = useWallets();

  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const asset = useAsset(params.asset);

  const navigationPayload = useMemo(() => {
    switch (inputType) {
      case AssetInputTypes.in:
        return {
          inputAsset: asset,
        };
      case AssetInputTypes.out:
        return { outputAsset: asset };
      default:
        return { asset };
    }
  }, [asset, inputType]);

  return useCallback(
    (routeName, traverseParams) => {
      if (isReadOnlyWallet) {
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
