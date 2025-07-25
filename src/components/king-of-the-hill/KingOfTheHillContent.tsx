import { ShimmerAnimation } from '@/components/animations';
import hillImage from '@/components/king-of-the-hill/hill.png';
import { KingOfTheHillPastWinners } from '@/components/king-of-the-hill/KingOfTheHillPastWinners';
import { useBackgroundColor, useColorMode } from '@/design-system';
import { KingOfTheHill, KingOfTheHillRankingElem } from '@/graphql/__generated__/metadata';
import { formatCurrency } from '@/helpers/strings';
import { abbreviateNumber } from '@/helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { useLegendListNavBarScrollToTop } from '@/navigation/MainListContext';
import { useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';
import { LegendList, LegendListRef } from '@legendapp/list';
import chroma from 'chroma-js';
import { dequal } from 'dequal';
import makeColorMoreChill from 'make-color-more-chill';
import React, { memo, ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KingOfTheHillHeader } from './KingOfTheHillHeader';
import { LaunchButton } from './LaunchButton';
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

export const KingOfTheHillContent = memo(function KingOfTheHillContent({
  scrollY,
  onColorExtracted,
}: {
  scrollY: SharedValue<number>;
  onColorExtracted?: (color: string | null) => void;
}) {
  const { kingOfTheHill, kingOfTheHillLeaderBoard } = useKingOfTheHillStore(store => store.getData(), dequal) || {};
  const { isDarkMode } = useColorMode();
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const { top: topInset } = useSafeAreaInsets();
  const [tokenDominantColor, setTokenDominantColor] = useState('#999');
  const listRef = useRef<LegendListRef | null>(null);

  useLegendListNavBarScrollToTop(listRef);

  const handleColorExtracted = useCallback((color: string | null) => {
    if (color) {
      setTokenDominantColor(color);
    }
  }, []);

  // effect to account for switching dark to light mode
  useLayoutEffect(() => {
    try {
      if (tokenDominantColor) {
        const chillColor = makeColorMoreChill(tokenDominantColor);
        const adjustedColor = isDarkMode
          ? // these are a bit tricky to get right, these values visually seem similar on light/dark
            chroma(chillColor).darken(3).desaturate(1.25).css()
          : chroma(chillColor).brighten(3).desaturate(1.7).css();
        setBackgroundColor(adjustedColor);
        onColorExtracted?.(adjustedColor);
      }
    } catch (error) {
      logger.error(new RainbowError(`Error adjusting color:`, error));
      setBackgroundColor(null);
      onColorExtracted?.(null);
    }
  }, [tokenDominantColor, isDarkMode, onColorExtracted]);

  const listData = useMemo((): ListItem[] => {
    if (!kingOfTheHillLeaderBoard || !kingOfTheHill) {
      return [];
    }

    const rankings = kingOfTheHillLeaderBoard?.rankings || [];

    const rankedItems = rankings
      // start from 2nd place (first is in header)
      .slice(1)
      .map(item => {
        return {
          type: 'item',
          ranking: item.rank,
          token: item.token,
          windowTradingVolume: item.windowTradingVolume,
        } satisfies ListItem;
      });

    return [
      {
        type: 'header',
        data: kingOfTheHill,
      },
      ...rankedItems,
      // to show past winners section (disabled until backend data available)
      // ...rankedItems.slice(0, 3),
      // { type: 'past-winners' },
      // ...rankedItems.slice(4),
      { type: 'bottom-pad' },
    ];
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

      if (item.type === 'past-winners') {
        return <KingOfTheHillPastWinners />;
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
    if (item.type !== 'item') {
      return item.type;
    }
    return `${item.token.address}-${item.token.chainId}`;
  }, []);

  let content: ReactNode = null;

  if (!kingOfTheHill && !kingOfTheHillLeaderBoard) {
    content = <KingOfTheHillLoading />;
  } else {
    content = (
      <LegendList
        data={listData}
        ref={listRef}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScroll={event => {
          'worklet';
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
      <HillBackground scrollY={scrollY} />
      {content}
      <LaunchButton />
    </View>
  );
});

const HillBackground = memo(function HillBackground({ scrollY }: { scrollY: SharedValue<number> }) {
  const { isDarkMode } = useColorMode();
  const { top: topInset } = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get('window');
  const hillWidth = Math.min(630, screenWidth);
  const hillHeight = hillWidth * 0.7;
  const hillImageHiddenByScrollY = 100;

  const hillAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, hillImageHiddenByScrollY], [1, 0], 'clamp');
    const translateY = interpolate(scrollY.value, [0, hillImageHiddenByScrollY], [0, -30], 'clamp');
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: topInset + 80,
          left: (screenWidth - hillWidth) / 2,
          width: hillWidth,
          height: hillHeight,
        },
        hillAnimatedStyle,
      ]}
    >
      <FastImage source={hillImage} resizeMode="contain" style={{ width: hillWidth, height: hillHeight, opacity: isDarkMode ? 0.5 : 1 }} />
    </Animated.View>
  );
});

const KingOfTheHillLoading = () => {
  const { isDarkMode } = useColorMode();
  const fill = useBackgroundColor('fill');
  const fillSecondary = useBackgroundColor('fillTertiary');

  return (
    <View style={[styles.skeletonContainer, { opacity: isDarkMode ? 0.2 : 1 }]}>
      <ShimmerAnimation color={fill} gradientColor={fillSecondary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 2,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  list: {
    zIndex: 1,
  },
});
