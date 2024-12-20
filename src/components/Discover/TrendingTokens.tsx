import { DropdownMenu } from '@/components/DropdownMenu';
import { globalColors, Text, TextIcon, useBackgroundColor, useColorMode } from '@/design-system';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';

import { SwapCoinIcon } from '@/__swaps__/screens/Swap/components/SwapCoinIcon';
import { analyticsV2 } from '@/analytics';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import Skeleton, { FakeAvatar, FakeText } from '@/components/skeleton/Skeleton';
import { SortDirection, Timeframe, TrendingCategory, TrendingSort } from '@/graphql/__generated__/arc';
import { formatCurrency, formatNumber } from '@/helpers/strings';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { FarcasterUser, TrendingToken, useTrendingTokens } from '@/resources/trendingTokens/trendingTokens';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { swapsStore } from '@/state/swaps/swapsStore';
import { sortFilters, timeFilters, useTrendingTokensStore } from '@/state/trendingTokens/trendingTokens';
import { colors } from '@/styles';
import { darkModeThemeColors } from '@/styles/colors';
import { useTheme } from '@/theme';
import { useCallback, useEffect, useMemo } from 'react';
import React, { Dimensions, FlatList, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { runOnJS, useSharedValue } from 'react-native-reanimated';
import { ButtonPressAnimation } from '../animations';
import { useFarcasterAccountForWallets } from '@/hooks/useFarcasterAccountForWallets';
import { ImgixImage } from '../images';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useAccountSettings } from '@/hooks';
import { getColorWorklet, getMixedColor, opacity } from '@/__swaps__/utils/swaps';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { IS_IOS } from '@/env';

const t = i18n.l.trending_tokens;

function FilterButton({
  icon,
  label,
  onPress,
  selected,
  iconColor,
  highlightedBackgroundColor,
}: {
  onPress?: VoidFunction;
  label: string;
  icon: string | JSX.Element;
  selected: boolean;
  iconColor?: string;
  highlightedBackgroundColor?: string;
}) {
  const { isDarkMode } = useColorMode();
  const fillTertiary = useBackgroundColor('fillTertiary');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const borderColor = selected && isDarkMode ? globalColors.white80 : separatorSecondary;
  const defaultIconColor = getColorWorklet('labelSecondary', selected ? false : isDarkMode);

  const gradientColors = useMemo(() => {
    if (!selected) return [fillTertiary, fillTertiary];
    return highlightedBackgroundColor
      ? [highlightedBackgroundColor, globalColors.white100]
      : [
          isDarkMode ? opacity(globalColors.white100, 0.72) : opacity(fillTertiary, 0.2),
          isDarkMode ? opacity(globalColors.white100, 0.92) : opacity(fillTertiary, 0),
        ];
  }, [fillTertiary, highlightedBackgroundColor, selected, isDarkMode]);

  return (
    <ButtonPressAnimation scaleTo={0.92} onPress={onPress}>
      <LinearGradient
        colors={gradientColors}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          height: 36,
          paddingHorizontal: 12 - THICK_BORDER_WIDTH,
          borderRadius: 18,
          borderWidth: THICK_BORDER_WIDTH,
          borderColor,
        }}
      >
        {typeof icon === 'string' ? (
          <TextIcon color={{ custom: iconColor || defaultIconColor }} size="icon 13px" weight="heavy" width={16}>
            {icon}
          </TextIcon>
        ) : (
          icon
        )}
        <View>
          {/* This first Text element sets the width of the container */}
          <Text align="center" color="label" size="17pt" weight="heavy" style={{ opacity: 0 }}>
            {label}
          </Text>
          {/* This second Text element is the visible label, positioned absolutely within the established frame */}
          <Text
            align="center"
            color={selected ? { custom: globalColors.grey100 } : 'labelSecondary'}
            size="17pt"
            style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
            weight={selected ? 'heavy' : 'bold'}
          >
            {label}
          </Text>
        </View>
        <Text color={{ custom: iconColor || defaultIconColor }} size="13pt" weight="bold" style={{ width: 14 }}>
          􀆏
        </Text>
      </LinearGradient>
    </ButtonPressAnimation>
  );
}

function useTrendingTokensData() {
  const { nativeCurrency } = useAccountSettings();
  const remoteConfig = useRemoteConfig();
  const { chainId, category, timeframe, sort } = useTrendingTokensStore(state => ({
    chainId: state.chainId,
    category: state.category,
    timeframe: state.timeframe,
    sort: state.sort,
  }));

  const walletAddress = useFarcasterAccountForWallets();

  return useTrendingTokens({
    chainId,
    category,
    timeframe,
    sortBy: sort,
    sortDirection: SortDirection.Desc,
    limit: remoteConfig.trending_tokens_limit,
    walletAddress: walletAddress,
    currency: nativeCurrency,
  });
}

function ReportAnalytics() {
  const activeSwipeRoute = useNavigationStore(state => state.activeSwipeRoute);
  const { category, chainId } = useTrendingTokensStore(state => ({ category: state.category, chainId: state.chainId }));
  const { data: trendingTokens, isLoading } = useTrendingTokensData();

  useEffect(() => {
    if (isLoading || activeSwipeRoute !== Routes.DISCOVER_SCREEN) return;

    const isEmpty = (trendingTokens?.length ?? 0) === 0;
    const isLimited = !isEmpty && (trendingTokens?.length ?? 0) < 6;

    analyticsV2.track(analyticsV2.event.viewRankedCategory, {
      category,
      chainId,
      isLimited,
      isEmpty,
    });
  }, [isLoading, activeSwipeRoute, trendingTokens?.length, category, chainId]);

  return null;
}

function CategoryFilterButton({
  category,
  icon,
  iconWidth = 16,
  iconColor,
  label,
  highlightedBackgroundColor,
}: {
  category: TrendingCategory;
  icon: string;
  iconColor: string | { default: string; selected: string };
  highlightedBackgroundColor: string;
  iconWidth?: number;
  label: string;
}) {
  const { isDarkMode } = useColorMode();
  const fillTertiary = useBackgroundColor('fillTertiary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const selected = useTrendingTokensStore(state => state.category === category);

  const borderColor = selected && isDarkMode ? globalColors.white80 : separatorSecondary;

  const gradientColors = useMemo(() => {
    if (!selected) return [fillTertiary, fillTertiary];
    return [highlightedBackgroundColor, globalColors.white100];
  }, [fillTertiary, highlightedBackgroundColor, selected]);

  const selectCategory = useCallback(() => {
    useTrendingTokensStore.getState().setCategory(category);
  }, [category]);

  return (
    <ButtonPressAnimation scaleTo={0.92} onPress={selectCategory}>
      <LinearGradient
        colors={gradientColors}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          height: 36,
          paddingHorizontal: 12,
          borderRadius: 18,
          borderWidth: THICK_BORDER_WIDTH,
          borderColor,
        }}
      >
        <TextIcon
          color={{ custom: typeof iconColor === 'string' ? iconColor : selected ? iconColor.selected : iconColor.default }}
          size="icon 13px"
          textStyle={IS_IOS ? { marginTop: -3.5 } : undefined}
          weight="heavy"
          width={iconWidth}
        >
          {icon}
        </TextIcon>
        <View>
          {/* This first Text element sets the width of the container */}
          <Text align="center" color="label" size="17pt" weight="heavy" style={{ opacity: 0 }}>
            {label}
          </Text>
          {/* This second Text element is the visible label, positioned absolutely within the established frame */}
          <Text
            align="center"
            color={selected ? { custom: globalColors.grey100 } : 'labelSecondary'}
            size="17pt"
            style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
            weight={selected ? 'heavy' : 'bold'}
          >
            {label}
          </Text>
        </View>
      </LinearGradient>
    </ButtonPressAnimation>
  );
}

function FriendPfp({ pfp_url }: { pfp_url: string }) {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  return (
    <ImgixImage
      source={{ uri: pfp_url }}
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
  );
}
function FriendHolders({ friends }: { friends: FarcasterUser[] }) {
  if (friends.length === 0) return null;
  const howManyOthers = Math.max(1, friends.length - 2);
  const separator = howManyOthers === 1 && friends.length === 2 ? ` ${i18n.t(t.and)} ` : ', ';

  return (
    <View style={{ flexDirection: 'row', gap: 5.67, height: 12, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingLeft: 6 }}>
        <FriendPfp pfp_url={friends[0].pfp_url} />
        {friends[1] && <FriendPfp pfp_url={friends[1].pfp_url} />}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text color="labelSecondary" size="11pt" weight="bold" numberOfLines={1}>
          {friends[0].username}
          {friends[1] && (
            <>
              <Text color="labelTertiary" size="11pt" weight="bold">
                {separator}
              </Text>
              {friends[1].username}
            </>
          )}
        </Text>
        {friends.length > 2 && (
          <Text color="labelTertiary" size="11pt" weight="bold">
            {' '}
            {i18n.t('trending_tokens.and_others', { count: howManyOthers })}
          </Text>
        )}
      </View>
    </View>
  );
}

function TrendingTokenLoadingRow() {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  const { isDarkMode } = useColorMode();
  return (
    <View style={{ flex: 1, height: 78, width: '100%' }}>
      <Skeleton>
        <View style={{ paddingVertical: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <FakeAvatar />

          <View style={{ gap: 12, flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 5.67, alignItems: 'center', marginTop: -2 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <View
                  style={{
                    height: 12 + 2,
                    width: 12 + 2,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: backgroundColor,
                    backgroundColor: isDarkMode ? darkModeThemeColors.skeleton : colors.skeleton,
                    marginVertical: -1,
                    marginLeft: -6,
                  }}
                />
                <View
                  style={{
                    height: 12 + 2,
                    width: 12 + 2,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: backgroundColor,
                    backgroundColor: isDarkMode ? darkModeThemeColors.skeleton : colors.skeleton,
                    marginVertical: -1,
                  }}
                />
              </View>

              <FakeText width={148} />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'baseline' }}>
                  <FakeText height={16} width={84} />
                  <FakeText height={14} width={32} />
                  <FakeText height={16} width={60} />
                </View>

                <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <FakeText height={14} width={32} />
                    <FakeText height={14} width={44} />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <FakeText height={14} width={36} />
                    <FakeText height={14} width={52} />
                  </View>
                </View>
              </View>

              <View style={{ gap: 8, marginLeft: 'auto' }}>
                <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                  <FakeText height={16} width={60} />
                </View>
                <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'flex-end' }}>
                  <FakeText width={40} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Skeleton>
    </View>
  );
}

function getPriceChangeColor(priceChange: number) {
  if (priceChange === 0) return 'labelTertiary';
  return priceChange > 0 ? 'green' : 'red';
}

function TrendingTokenRow({ token }: { token: TrendingToken }) {
  const separatorColor = useForegroundColor('separator');

  const price = formatCurrency(token.price);
  const marketCap = formatNumber(token.marketCap, { useOrderSuffix: true, decimals: 1, style: '$' });
  const volume = formatNumber(token.volume, { useOrderSuffix: true, decimals: 1, style: '$' });

  const handleNavigateToToken = useCallback(() => {
    analyticsV2.track(analyticsV2.event.viewTrendingToken, {
      address: token.address,
      chainId: token.chainId,
      symbol: token.symbol,
      name: token.name,
      highlightedFriends: token.highlightedFriends.length,
    });

    swapsStore.setState({
      lastNavigatedTrendingToken: token.uniqueId,
    });

    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET, {
      asset: token,
      type: 'token',
    });
  }, [token]);

  if (!token) return null;

  return (
    <ButtonPressAnimation onPress={handleNavigateToToken} scaleTo={0.94}>
      <View style={{ height: 48, overflow: 'visible', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <SwapCoinIcon
          iconUrl={token.icon_url}
          color={token.colors.primary}
          chainId={token.chainId}
          address={token.address}
          symbol={token.symbol}
          size={40}
          chainSize={20}
        />

        <View style={{ gap: 12, flex: 1 }}>
          <FriendHolders friends={token.highlightedFriends} />

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 6,
                  height: 10,
                  alignItems: 'baseline',
                  maxWidth:
                    Dimensions.get('screen').width -
                    40 - // 40 screen paddings
                    (40 + 12) - // 40 token icon, 12 gap
                    70, // 70 width for price change %
                }}
              >
                <Text color="label" size="15pt" weight="bold" style={{ maxWidth: 100, flexShrink: 1 }} numberOfLines={1}>
                  {token.name}
                </Text>
                <Text color="labelTertiary" size="11pt" weight="bold" style={{ flexGrow: 0 }} numberOfLines={1}>
                  {token.symbol}
                </Text>
                <Text color="label" size="15pt" weight="bold">
                  {price}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, height: 7, alignItems: 'center' }}>
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
              <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'flex-end' }}>
                <Text color={getPriceChangeColor(token.priceChange.day)} size="15pt" weight="bold">
                  {formatNumber(token.priceChange.day, { decimals: 2, useOrderSuffix: true })}%
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'flex-end' }}>
                <Text color="labelQuaternary" size="11pt" weight="bold">
                  1H
                </Text>
                <Text color={getPriceChangeColor(token.priceChange.hr)} size="11pt" weight="bold">
                  {formatNumber(token.priceChange.hr, { decimals: 2, useOrderSuffix: true })}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ButtonPressAnimation>
  );
}

function NoResults() {
  const { isDarkMode } = useColorMode();
  const fillQuaternary = useBackgroundColor('fillQuaternary');
  const backgroundColor = isDarkMode ? '#191A1C' : fillQuaternary;

  return (
    <View style={{ flex: 1, padding: 20, flexDirection: 'row', justifyContent: 'space-between', backgroundColor, borderRadius: 20 }}>
      <View style={{ flex: 1, gap: 16 }}>
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
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();

  const selected = useSharedValue<ChainId | undefined>(undefined);
  const chainId = useTrendingTokensStore(state => state.chainId);
  const setChainId = useTrendingTokensStore(state => state.setChainId);

  const { icon, label, lightenedNetworkColor } = useMemo(() => {
    if (!chainId) return { icon: '􀤆', label: i18n.t(t.all), lightenedNetworkColor: undefined };
    return {
      icon: (
        <View style={{ marginRight: 2 }}>
          <ChainImage chainId={chainId} size={16} />
        </View>
      ),
      label: useBackendNetworksStore.getState().getChainsLabel()[chainId],
      lightenedNetworkColor: colors.networkColors[chainId]
        ? getMixedColor(colors.networkColors[chainId], globalColors.white100, isDarkMode ? 0.55 : 0.6)
        : undefined,
    };
  }, [chainId, colors.networkColors, isDarkMode]);

  const setSelected = useCallback(
    (chainId: ChainId | undefined) => {
      'worklet';
      selected.value = chainId;
      runOnJS(setChainId)(chainId);
    },
    [selected, setChainId]
  );

  const navigateToNetworkSelector = useCallback(() => {
    Navigation.handleAction(Routes.NETWORK_SELECTOR, {
      selected,
      setSelected,
    });
  }, [selected, setSelected]);

  return (
    <FilterButton
      selected={!!chainId}
      highlightedBackgroundColor={lightenedNetworkColor}
      label={label}
      icon={icon}
      onPress={navigateToNetworkSelector}
    />
  );
}

function TimeFilter() {
  const timeframe = useTrendingTokensStore(state => state.timeframe);
  const shouldAbbreviate = timeframe === Timeframe.H24 || timeframe === Timeframe.H12;

  return (
    <DropdownMenu
      menuConfig={{
        menuItems: timeFilters.map(time => ({
          actionTitle: i18n.t(t.filters.time[time]),
          actionKey: time,
        })),
      }}
      side="bottom"
      onPressMenuItem={timeframe => useTrendingTokensStore.getState().setTimeframe(timeframe)}
    >
      <FilterButton
        selected={timeframe !== Timeframe.D3}
        iconColor={undefined}
        highlightedBackgroundColor={undefined}
        label={shouldAbbreviate ? i18n.t(t.filters.time[`${timeframe}_ABBREVIATED`]) : i18n.t(t.filters.time[timeframe])}
        icon="􀐫"
      />
    </DropdownMenu>
  );
}

function SortFilter() {
  const sort = useTrendingTokensStore(state => state.sort);
  const selected = sort !== TrendingSort.Recommended;

  const iconColor = useForegroundColor(selected ? 'labelSecondary' : 'labelTertiary');

  return (
    <DropdownMenu
      menuConfig={{
        menuItems: sortFilters
          .filter(s => s !== 'RECOMMENDED')
          .map(sort => ({
            actionTitle: i18n.t(t.filters.sort[sort]),
            actionKey: sort,
          })),
      }}
      side="bottom"
      onPressMenuItem={selection => {
        if (selection === sort) return useTrendingTokensStore.getState().setSort(TrendingSort.Recommended);
        useTrendingTokensStore.getState().setSort(selection);
      }}
    >
      <FilterButton
        selected={selected}
        iconColor={undefined}
        highlightedBackgroundColor={undefined}
        label={i18n.t(t.filters.sort[sort])}
        icon={
          <Text color={{ custom: iconColor }} size="icon 13px" weight="heavy" style={{ width: 20 }}>
            􀄬
          </Text>
        }
      />
    </DropdownMenu>
  );
}

function TrendingTokensLoader() {
  const { trending_tokens_limit } = useRemoteConfig();

  return (
    <View style={{ flex: 1 }}>
      {Array.from({ length: trending_tokens_limit }).map((_, index) => (
        <TrendingTokenLoadingRow key={index} />
      ))}
    </View>
  );
}

function TrendingTokenData() {
  const { data: trendingTokens, isLoading } = useTrendingTokensData();
  if (isLoading) return <TrendingTokensLoader />;

  return (
    <FlatList
      style={{ marginHorizontal: -20, marginVertical: -12, paddingBottom: 20, paddingTop: 12 }}
      contentContainerStyle={{ gap: 28, paddingHorizontal: 20 }}
      ListEmptyComponent={<NoResults />}
      data={trendingTokens}
      renderItem={({ item }) => <TrendingTokenRow token={item} />}
    />
  );
}

const padding = 20;

export function TrendingTokens() {
  const { isDarkMode } = useColorMode();
  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 12, justifyContent: 'center' }}>
        <Animated.ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal
          contentContainerStyle={{ alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: padding }}
          style={{ marginHorizontal: -padding }}
        >
          <CategoryFilterButton
            category={TrendingCategory.Trending}
            label={i18n.t(t.filters.categories.TRENDING)}
            icon="􀙭"
            iconColor={'#D0281C'}
            highlightedBackgroundColor={'#E6A39E'}
          />
          <CategoryFilterButton
            category={TrendingCategory.New}
            label={i18n.t(t.filters.categories.NEW)}
            icon="􀋃"
            iconColor={{ default: isDarkMode ? globalColors.yellow60 : '#FFBB00', selected: '#F5A200' }}
            highlightedBackgroundColor={'#FFEAC2'}
            iconWidth={18}
          />
          <CategoryFilterButton
            category={TrendingCategory.Farcaster}
            label={i18n.t(t.filters.categories.FARCASTER)}
            icon="􀌥"
            iconColor={'#5F5AFA'}
            highlightedBackgroundColor={'#B9B7F7'}
            iconWidth={20}
          />
        </Animated.ScrollView>

        <Animated.ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal
          contentContainerStyle={{ alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: padding }}
          style={{ marginHorizontal: -padding }}
        >
          <NetworkFilter />
          <TimeFilter />
          <SortFilter />
        </Animated.ScrollView>
      </View>

      <TrendingTokenData />
      <ReportAnalytics />
    </View>
  );
}
