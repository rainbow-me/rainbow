import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useNavigation, useNavigationState } from 'react-navigation-hooks';
import useAsset from './useAsset';

export default function useExpandedStateNavigation() {
  const { goBack, navigate } = useNavigation();
  const { params } = useNavigationState();

  const selectedAsset = useAsset(params.asset);

  return useCallback(
    route => {
      goBack();
      return InteractionManager.runAfterInteractions(() => {
        return navigate(route, { asset: selectedAsset });
      });
    },
    [goBack, navigate, selectedAsset]
  );
}
