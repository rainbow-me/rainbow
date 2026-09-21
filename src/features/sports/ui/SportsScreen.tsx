import { useRef } from 'react';
import { Keyboard } from 'react-native';

import { useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSportsGamePress } from '@/features/polymarket/hooks/useSportsGamePress';
import { SportsBrowse, type SportsBrowseHandle } from '@/features/sports/ui/SportsBrowse';
import { useOnLeaveRoute } from '@/hooks/useOnLeaveRoute';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

export function SportsScreen() {
  const { top } = useSafeAreaInsets();
  const bottom = useTabBarOffset();

  const visible = useNavigationStore(state => state.activeRoute === Routes.SPORTS_SCREEN);
  const browse = useRef<SportsBrowseHandle>(null);
  const onGamePress = useSportsGamePress();

  // @ts-expect-error React Navigation 6 types predate React 19's explicitly nullable refs.
  useScrollToTop(browse);
  useOnLeaveRoute(Keyboard.dismiss);

  return <SportsBrowse ref={browse} host="main" visible={visible} topInset={top} bottomInset={bottom} onGamePress={onGamePress} />;
}
