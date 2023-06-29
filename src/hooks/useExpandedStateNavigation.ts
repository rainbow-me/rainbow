import { useRoute } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import useAsset from './useAsset';
import useWallets from './useWallets';
import { enableActionsOnReadOnlyWallet } from '@/config';
import AssetInputTypes from '@/helpers/assetInputTypes';
import { useNavigation } from '@/navigation';
import { watchingAlert } from '@/utils';

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
    (routeName: string, traverseParams: any) => {
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
