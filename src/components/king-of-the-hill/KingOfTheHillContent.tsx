import { useColorMode } from '@/design-system';
import { KingOfTheHill, KingOfTheHillRankingElem } from '@/graphql/__generated__/metadata';
import { formatCurrency } from '@/helpers/strings';
import { abbreviateNumber } from '@/helpers/utilities';
import { usePrevious } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { Skeleton } from '@/screens/points/components/Skeleton';
import { useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { LegendList } from '@legendapp/list';
import chroma from 'chroma-js';
import { dequal } from 'dequal';
import makeColorMoreChill from 'make-color-more-chill';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KingOfTheHillHeader } from './KingOfTheHillHeader';
import { LeaderboardItem } from './LeaderboardItem';

type HeaderItem = {
  type: 'header';
  data: KingOfTheHill;
};

type LeaderboardListItem = {
  type: 'item';
  ranking: number;
  token: KingOfTheHillRankingElem['token'];
  windowTradingVolume: string;
};

type BottomPadItem = {
  type: 'bottom-pad';
};

type PastWinnersItem = {
  type: 'past-winners';
};

type ListItem = HeaderItem | LeaderboardListItem | PastWinnersItem | BottomPadItem;

export const KingOfTheHillContent = ({
  scrollY,
  onColorExtracted,
}: {
  scrollY: SharedValue<number>;
  onColorExtracted?: (color: string | null) => void;
}) => {
  const { kingOfTheHill, kingOfTheHillLeaderBoard } = useKingOfTheHillStore(store => store.getData(), dequal) || {};
  const { isDarkMode } = useColorMode();
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const { top: topInset } = useSafeAreaInsets();
  const [tokenDominantColor, setTokenDominantColor] = useState('#999');

  const handleColorExtracted = useCallback((color: string | null) => {
    if (color) {
      setTokenDominantColor(color);
    }
  }, []);

  useEffect(() => {
    try {
      if (tokenDominantColor) {
        const chillColor = makeColorMoreChill(tokenDominantColor);
        const adjustedColor = isDarkMode
          ? chroma(chillColor).darken(3.5).desaturate(1.5).alpha(0.8).css()
          : chroma(chillColor).brighten(2).desaturate(1.5).alpha(0.8).css();
        setBackgroundColor(adjustedColor);
        onColorExtracted?.(adjustedColor);
      }
    } catch (error) {
      console.warn('Error adjusting color:', error);
      setBackgroundColor(null);
      onColorExtracted?.(null);
    }
  }, [tokenDominantColor, isDarkMode, onColorExtracted]);

  const listData = useMemo(() => {
    if (!kingOfTheHillLeaderBoard || !kingOfTheHill) {
      return [];
    }

    const rankings = kingOfTheHillLeaderBoard?.rankings || [];

    const data: ListItem[] = [
      {
        type: 'header',
        data: kingOfTheHill,
      },
      ...rankings
        .filter(item => item.rank > 1) // Start from 2nd place
        .map(item => {
          return {
            type: 'item',
            ranking: item.rank,
            token: item.token,
            windowTradingVolume: item.windowTradingVolume,
          } satisfies ListItem;
        }),
      { type: 'bottom-pad' },
    ];

    return data;
  }, [kingOfTheHill, kingOfTheHillLeaderBoard]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.headerContainer}>
            <KingOfTheHillHeader kingOfTheHill={item.data} onColorExtracted={handleColorExtracted} />
          </View>
        );
      }

      if (item.type === 'bottom-pad') {
        return <View style={styles.bottomPadding} />;
      }

      const price = item.token.price?.value ? formatCurrency(item.token.price.value) : 'N/A';

      const volume = item.windowTradingVolume ? `$${abbreviateNumber(parseFloat(item.windowTradingVolume), 1)}` : 'N/A';

      const marketCap = item.token.marketCap ? `$${abbreviateNumber(item.token.marketCap, 1)}` : 'N/A';

      return (
        <LeaderboardItem
          token={item.token}
          ranking={item.ranking}
          priceChange={item.token.price?.relativeChange24h}
          volume={volume}
          marketCap={marketCap}
          price={price}
        />
      );
    },
    [handleColorExtracted]
  );

  const keyExtractor = useCallback((item: ListItem) => {
    if (item.type !== 'item') return item.type;
    return `${item.token.address}-${item.token.chainId}`;
  }, []);

  let content: ReactNode = null;

  if (!kingOfTheHill && !kingOfTheHillLeaderBoard) {
    content = (
      <View style={[styles.skeletonContainer, { marginTop: topInset + 40 }]}>
        <Skeleton width={'100%'} height={400} />
      </View>
    );
  } else {
    content = (
      <LegendList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        onScroll={event => {
          if (scrollY) {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }
        }}
        contentContainerStyle={{ paddingTop: topInset + 40 }}
        style={styles.list}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor || undefined }]}>
      {content}
      <SyncStoreEnabled />
    </View>
  );
};

function SyncStoreEnabled() {
  const activeSwipeRoute = useNavigationStore(state => state.activeSwipeRoute);
  const previousActiveSwipeRoute = usePrevious(activeSwipeRoute);

  if (activeSwipeRoute === Routes.KING_OF_THE_HILL && previousActiveSwipeRoute !== Routes.KING_OF_THE_HILL) {
    useKingOfTheHillStore.setState({
      enabled: true,
    });
  }
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderRadius: 20,
    padding: 20,
  },
  bottomPadding: {
    height: 180,
  },
  skeletonContainer: {
    borderRadius: 20,
    padding: 20,
  },
  list: {
    zIndex: 1,
  },
});
