import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback } from 'react';
import { Alert, InteractionManager } from 'react-native';
import useAsset from './useAsset';
import useWallets from './useWallets';

export default function useExpandedStateNavigation() {
  const { goBack, navigate } = useNavigation();
  const { params } = useRoute();
  const { isReadOnlyWallet } = useWallets();

  const asset = useAsset(params.asset);

  return useCallback(
    route => {
      goBack();

      return isReadOnlyWallet
        ? Alert.alert(`You need to import the wallet in order to do this`)
        : InteractionManager.runAfterInteractions(() =>
            navigate(route, { asset })
          );
    },
    [asset, goBack, isReadOnlyWallet, navigate]
  );
}
