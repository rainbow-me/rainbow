import { useRoute } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { Alert, InteractionManager } from 'react-native';
import AssetInputTypes from '../helpers/assetInputTypes';
import { useNavigation } from '../navigation/Navigation';
import useAsset from './useAsset';
import useWallets from './useWallets';

export default function useExpandedStateNavigation(inputType) {
  const { goBack, navigate } = useNavigation();
  const { params } = useRoute();
  const { isReadOnlyWallet } = useWallets();

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
        return Alert.alert(`You need to import the wallet in order to do this`);
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
