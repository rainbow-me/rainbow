import { useCallback, useMemo } from 'react';
import { Alert, InteractionManager } from 'react-native';
import { useNavigation, useNavigationState } from 'react-navigation-hooks';
import AssetInputTypes from '../helpers/assetInputTypes';
import useAsset from './useAsset';
import useWallets from './useWallets';

export default function useExpandedStateNavigation(inputType) {
  const { goBack, navigate } = useNavigation();
  const { params } = useNavigationState();
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
    route => {
      goBack();

      return isReadOnlyWallet
        ? Alert.alert(`You need to import the wallet in order to do this`)
        : InteractionManager.runAfterInteractions(() =>
            navigate(route, navigationPayload)
          );
    },
    [goBack, isReadOnlyWallet, navigate, navigationPayload]
  );
}
