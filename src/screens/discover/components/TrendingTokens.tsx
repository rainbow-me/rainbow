import { ChainId } from '@/chains/types';
import { ChainBadge } from '@/components/coin-icon';
import { DropdownMenu } from '@/components/DropdownMenu';
import { globalColors, Text, useBackgroundColor } from '@/design-system';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';

import chroma from 'chroma-js';
import { useState } from 'react';
import React, { View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { LinearTransition, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { NetworkSelector } from './NetworkSwitcher';
import * as i18n from '@/languages';
import { useTheme } from '@/theme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

function FilterButton({ icon, label, onPress }: { onPress?: VoidFunction; label: string; icon: string }) {
  const pressed = useSharedValue(false);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = true;
      if (onPress) runOnJS(onPress)();
    })
    .onFinalize(() => (pressed.value = false));

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.95 : 1, { duration: 100 }) }],
  }));

  const backgroundColor = useBackgroundColor('fillTertiary');
  const borderColor = useBackgroundColor('fillSecondary');

  const iconColor = useForegroundColor('labelQuaternary');

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            height: 36,
            paddingHorizontal: 12,
            borderRadius: 18,
            borderWidth: 1.33,
            borderColor,
            backgroundColor,
          },
          animatedStyles,
        ]}
      >
        <Text color={{ custom: iconColor }} size="icon 13px" weight="heavy" style={{ width: 16 }}>
          {icon}
        </Text>
        <Text color="labelSecondary" size="17pt" weight="bold">
          {label}
        </Text>
        <Text color={{ custom: iconColor }} size="13pt" weight="bold" style={{ width: 14 }}>
          􀆏
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

function CategoryFilterButton({
  selected,
  onPress,
  icon,
  iconWidth = 16,
  iconColor,
  label,
}: {
  onPress: VoidFunction;
  selected: boolean;
  icon: string;
  iconColor: string;
  iconWidth?: number;
  label: string;
}) {
  const { isDarkMode } = useTheme();
  const fillTertiary = useBackgroundColor('fillTertiary');
  const fillSecondary = useBackgroundColor('fillSecondary');

  const borderColor = selected && isDarkMode ? globalColors.white80 : fillSecondary;

  const pressed = useSharedValue(false);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = true;
      runOnJS(onPress)();
    })
    .onFinalize(() => (pressed.value = false));

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.95 : 1, { duration: 100 }) }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <AnimatedLinearGradient
        colors={selected ? [chroma(iconColor).luminance(0.5).hex(), 'white'] : [fillTertiary, fillTertiary]}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            height: 36,
            paddingHorizontal: 12,
            borderRadius: 18,
            borderWidth: 1.33,
            borderColor,
          },
          animatedStyles,
        ]}
        layout={LinearTransition}
      >
        <Text color={{ custom: iconColor }} size="icon 13px" weight="heavy" style={{ width: iconWidth }}>
          {icon}
        </Text>
        <Text color={selected ? { custom: 'black' } : 'labelSecondary'} size="17pt" weight={selected ? 'heavy' : 'bold'}>
          {label}
        </Text>
      </AnimatedLinearGradient>
    </GestureDetector>
  );
}

function FriendHolders() {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  return (
    <View style={{ flexDirection: 'row', gap: 5.67, alignItems: 'center', marginTop: -2 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
        <FastImage
          source={{
            uri: 'https://rainbowme-res.cloudinary.com/image/upload/v1654696359/assets/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png',
          }}
          style={{
            height: 12 + 2,
            width: 12 + 2,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: backgroundColor,
            marginVertical: -1,
            marginLeft: -6,
          }}
        />
        <FastImage
          source={{
            uri: 'https://rainbowme-res.cloudinary.com/image/upload/v1654696359/assets/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png',
          }}
          style={{
            height: 12 + 2,
            width: 12 + 2,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: backgroundColor,
            marginVertical: -1,
            marginLeft: -6,
          }}
        />
      </View>

      <Text color="labelSecondary" size="11pt" weight="bold">
        mikedemarais{' '}
        <Text color="labelTertiary" size="11pt" weight="bold">
          and 2 others
        </Text>
      </Text>
    </View>
  );
}

function TokenIcon({ uri, chainId }: { uri: string; chainId: ChainId }) {
  return (
    <View style={{ position: 'relative' }}>
      <FastImage source={{ uri }} style={{ height: 40, width: 40, borderRadius: 20 }} />
      {chainId !== ChainId.mainnet && <ChainBadge chainId={10} position="absolute" badgeXPosition={-10} />}
    </View>
  );
}

function TrendingTokenRow() {
  const separatorColor = useForegroundColor('separator');

  const percentChange24h = '3.40%';
  const percentChange1h = '8.82%';

  const token = {
    name: 'Uniswap',
    symbol: 'UNI',
    price: '$9.21',
  };

  const volume = '$1.8M';
  const marketCap = '$1.8M';

  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <TokenIcon
        chainId={1}
        uri="https://rainbowme-res.cloudinary.com/image/upload/v1654696359/assets/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png"
      />

      <View style={{ gap: 12, flex: 1 }}>
        <FriendHolders />

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'baseline' }}>
              <Text color="label" size="15pt" weight="bold" style={{ maxWidth: 100 }} numberOfLines={1}>
                {token.name}
              </Text>
              <Text color="labelTertiary" size="11pt" weight="bold" style={{ maxWidth: 50 }} numberOfLines={1}>
                {token.symbol}
              </Text>
              <Text color="label" size="15pt" weight="bold" style={{ maxWidth: 100 }} numberOfLines={1}>
                {token.price}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text color="labelQuaternary" size="11pt" weight="bold">
                  VOL
                </Text>
                <Text color="labelTertiary" size="11pt" weight="bold">
                  {volume}
                </Text>
              </View>

              <Text color={{ custom: separatorColor }} size="icon 9px" weight="bold">
                |
              </Text>

              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text color="labelQuaternary" size="11pt" weight="bold">
                  MCAP
                </Text>
                <Text color="labelTertiary" size="11pt" weight="bold">
                  {marketCap}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ gap: 12, marginLeft: 'auto' }}>
            <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <Text color="green" size="11pt" weight="bold">
                􀄨
              </Text>
              <Text color="green" size="15pt" weight="bold">
                {percentChange24h}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'flex-end' }}>
              <Text color="labelQuaternary" size="11pt" weight="bold">
                1H
              </Text>
              <Text color="green" size="11pt" weight="bold">
                {percentChange1h}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const t = i18n.l.trending_tokens;

function NoResults() {
  const { isDarkMode } = useTheme();
  const fillQuaternary = useBackgroundColor('fillQuaternary');
  const backgroundColor = isDarkMode ? '#191A1C' : fillQuaternary;

  return (
    <View style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', backgroundColor, borderRadius: 20 }}>
      <View style={{ gap: 16 }}>
        <Text color="label" size="20pt" weight="heavy">
          {i18n.t(t.no_results.title)}
        </Text>
        <Text color="labelSecondary" size="15pt" weight="semibold">
          {i18n.t(t.no_results.body)}
        </Text>
      </View>
      <View style={{ backgroundColor: '#FF584D', height: 36, width: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
        <Text color={{ custom: 'white' }} size="13pt" style={{ textAlign: 'center', paddingLeft: 2, paddingTop: 1 }}>
          􀙭
        </Text>
      </View>
    </View>
  );
}

function NetworkFilter() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <FilterButton label="All" icon="􀤆" onPress={() => setOpen(true)} />
      {isOpen && (
        <NetworkSelector
          onClose={selected => {
            console.log(selected);
            setOpen(false);
          }}
          onSelect={() => null}
          multiple
        />
      )}
    </>
  );
}

const sortFilters = ['volume', 'market_cap', 'top_gainers', 'top_losers'] as const;
const timeFilters = ['day', 'week', 'month'] as const;
type TrendingTokensFilter = {
  category: 'trending' | 'new' | 'farcaster';
  network: undefined | ChainId;
  timeframe: (typeof timeFilters)[number];
  sort: (typeof sortFilters)[number] | undefined;
};

export function TrendingTokens() {
  const [filter, setFilter] = useState<TrendingTokensFilter>({
    category: 'trending',
    network: undefined,
    timeframe: 'day',
    sort: 'volume',
  });
  const setCategory = (category: TrendingTokensFilter['category']) => setFilter(filter => ({ ...filter, category }));
  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 12, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
          <CategoryFilterButton
            label={i18n.t(t.filters.categories.trending)}
            icon="􀙭"
            iconColor={'#D0281C'}
            selected={filter.category === 'trending'}
            onPress={() => setCategory('trending')}
          />
          <CategoryFilterButton
            label={i18n.t(t.filters.categories.new)}
            icon="􀋃"
            iconColor={'#FFDA24'}
            iconWidth={18}
            selected={filter.category === 'new'}
            onPress={() => setCategory('new')}
          />
          <CategoryFilterButton
            label={i18n.t(t.filters.categories.farcaster)}
            icon="􀌥"
            iconColor={globalColors.purple60}
            iconWidth={20}
            selected={filter.category === 'farcaster'}
            onPress={() => setCategory('farcaster')}
          />
        </View>

        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
          <NetworkFilter />

          <DropdownMenu
            menuConfig={{
              menuItems: timeFilters.map(time => ({
                actionTitle: i18n.t(t.filters.time[time]),
                actionKey: time,
              })),
            }}
            side="bottom"
            onPressMenuItem={timeframe => setFilter(filter => ({ ...filter, timeframe }))}
          >
            <FilterButton label={i18n.t(t.filters.time[filter.timeframe])} icon="􀐫" />
          </DropdownMenu>

          <DropdownMenu
            menuConfig={{
              menuItems: sortFilters.map(sort => ({
                actionTitle: i18n.t(t.filters.sort[sort]),
                actionKey: sort,
              })),
            }}
            side="bottom"
            onPressMenuItem={sort =>
              setFilter(filter => {
                if (sort === filter.sort) return { ...filter, sort: undefined };
                return { ...filter, sort };
              })
            }
          >
            <FilterButton label={i18n.t(t.filters.sort[filter.sort || 'sort'])} icon="􀄬" />
          </DropdownMenu>
        </View>
      </View>

      <NoResults />

      <View style={{ gap: 26 }}>
        <TrendingTokenRow />
        <TrendingTokenRow />
        <TrendingTokenRow />
        <TrendingTokenRow />
        <TrendingTokenRow />
        <TrendingTokenRow />
      </View>
    </View>
  );
}
