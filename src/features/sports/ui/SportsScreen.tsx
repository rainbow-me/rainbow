import { useRef } from 'react';
import { Keyboard } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSportsGamePress } from '@/features/polymarket/hooks/useSportsGamePress';
import { SportsBrowse, type SportsBrowseHandle } from '@/features/sports/ui/SportsBrowse';
import { useOnLeaveRoute } from '@/hooks/useOnLeaveRoute';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import Routes from '@/navigation/routesNames';
import { useOnTabReselect } from '@/navigation/tabEvents';
import { useNavigationStore } from '@/state/navigation/navigationStore';

export function SportsScreen() {
  const { top } = useSafeAreaInsets();
  const bottom = useTabBarOffset();

  const visible = useNavigationStore(state => state.activeRoute === Routes.SPORTS_SCREEN);
  const browse = useRef<SportsBrowseHandle>(null);
  const onGamePress = useSportsGamePress();

  useOnTabReselect(() => browse.current?.scrollToTop());
  useOnLeaveRoute(Keyboard.dismiss);

  return <SportsBrowse ref={browse} host="main" visible={visible} topInset={top} bottomInset={bottom} onGamePress={onGamePress} />;
}
