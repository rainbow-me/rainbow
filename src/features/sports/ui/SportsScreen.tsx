import { useCallback, useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSportsGamePress } from '@/features/polymarket/hooks/useSportsGamePress';
import { SportsBrowse, type SportsBrowseHandle } from '@/features/sports/ui/SportsBrowse';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { useMainListScrollToTop } from '@/navigation/MainListContext';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

export function SportsScreen() {
  const visible = useNavigationStore(state => state.activeRoute === Routes.SPORTS_SCREEN);
  const { top } = useSafeAreaInsets();
  const bottom = useTabBarOffset();
  const browse = useRef<SportsBrowseHandle>(null);
  const onGamePress = useSportsGamePress(Routes.SPORTS_SCREEN);
  const scrollToTop = useCallback(() => browse.current?.scrollToTop(), []);
  useMainListScrollToTop(scrollToTop);

  useEffect(() => {
    if (!visible) Keyboard.dismiss();
  }, [visible]);

  return (
    <SportsBrowse
      ref={browse}
      host="main"
      visible={visible}
      route={Routes.SPORTS_SCREEN}
      topInset={top}
      bottomInset={bottom}
      onGamePress={onGamePress}
    />
  );
}
