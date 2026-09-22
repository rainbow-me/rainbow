import { useRef, type ReactElement } from 'react';
import { Keyboard } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSportsGamePress } from '@/features/polymarket/hooks/useSportsGamePress';
import { SportsGamesList, type SportsGamesListHandle } from '@/features/sports/ui/SportsGamesList';
import { useOnLeaveRoute } from '@/hooks/useOnLeaveRoute';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { useOnTabReselect } from '@/navigation/tabEvents';

export function SportsScreen(): ReactElement {
  const { top } = useSafeAreaInsets();
  const bottom = useTabBarOffset();

  const gamesListRef = useRef<SportsGamesListHandle>(null);
  const onGamePress = useSportsGamePress();

  useOnLeaveRoute(Keyboard.dismiss);
  useOnTabReselect(() => gamesListRef.current?.scrollToTop());

  return <SportsGamesList ref={gamesListRef} host="main" topInset={top} bottomInset={bottom} onGamePress={onGamePress} />;
}
