import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { LegendList } from '@legendapp/list';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import { TOP_INSET } from '@/components/DappBrowser/Dimensions';
import { PANEL_COLOR_DARK, PANEL_COLOR_LIGHT, Panel } from '@/components/SmoothPager/ListPanel';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { DecoyScrollView } from '@/components/sheet/DecoyScrollView';
import {
  Box,
  BoxProps,
  IconContainer,
  Separator,
  Stack,
  Text,
  TextProps,
  TextShadow,
  globalColors,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { IS_IOS } from '@/env';
import i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { RainbowClaimable } from '@/resources/addys/claimables/types';
import { ChainId } from '@/state/backendNetworks/types';
import { FULL_PAGE_SIZE, INITIAL_PAGE_SIZE, useAirdropsStore } from '@/state/claimables/airdropsStore';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { safeAreaInsetValues, time } from '@/utils';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';

export interface AirdropClaimable {
  address: string;
  airdropValue: string;
  chainId: ChainId;
  hasZeroValue: boolean;
  icon: string;
  name: string;
  onPress: (claimable: RainbowClaimable) => void;
  symbol: string;
  uniqueId: string;
}

const COIN_ROW_HEIGHT = 40;
const COIN_ROW_GAP = 24;
const CLOSE_BUTTON_SIZE = 34;
const HEADER_HEIGHT = 70;
const PANEL_HEIGHT = DEVICE_HEIGHT - TOP_INSET - safeAreaInsetValues.bottom;
const SCROLL_INDICATOR_INSETS = { bottom: 44, top: 4 };

export const AirdropsSheet = () => {
  const { isDarkMode } = useColorMode();
  const separator = useForegroundColor('separator');
  return (
    <View style={styles.container}>
      <Panel height={PANEL_HEIGHT}>
        <CloseButton />
        <Box alignItems="center" gap={24} justifyContent="center" paddingTop="32px" width="full">
          <SheetHandleFixedToTop />
          <Text align="center" color="label" containsEmoji size="20pt" weight="heavy">
            {i18n.token_launcher.airdrops_sheet.title()}
          </Text>
          <Box width={DEVICE_WIDTH - 26 * 2}>
            <Separator color={{ custom: opacity(separator, 0.025) }} thickness={1} />
          </Box>
        </Box>

        <AirdropsList />

        <EasingGradient
          endColor={isDarkMode ? PANEL_COLOR_DARK : PANEL_COLOR_LIGHT}
          endOpacity={1}
          startColor={isDarkMode ? PANEL_COLOR_DARK : PANEL_COLOR_LIGHT}
          startOpacity={0}
          style={styles.footerGradient}
        />
      </Panel>
      <DecoyScrollView />
    </View>
  );
};

const CloseButton = () => {
  const { goBack } = useNavigation();
  const separator = useForegroundColor('separator');
  return (
    <View style={styles.closeButtonContainer}>
      <ButtonPressAnimation onPress={goBack} scaleTo={0.8} style={styles.closeButton}>
        <IconContainer
          background="fillQuaternary"
          borderColor={{ custom: opacity(separator, 0.025) }}
          borderRadius={38}
          borderWidth={2}
          height={CLOSE_BUTTON_SIZE}
          hitSlop={16}
          width={CLOSE_BUTTON_SIZE}
        >
          <Text color="labelSecondary" size="icon 14px" style={IS_IOS ? undefined : styles.closeButtonIconOffset} weight="black">
            􀆄
          </Text>
        </IconContainer>
      </ButtonPressAnimation>
    </View>
  );
};

const EMPTY_LIST_DATA: RainbowClaimable[] = [];

const AirdropsList = () => {
  const { navigate } = useNavigation();

  const airdrops = useAirdropsStore(state => state.getAirdrops());
  const fetchNextPage = useAirdropsStore(state => state.fetchNextPage);

  // Fetch next page on mount if available
  useEffect(() => {
    if (airdrops?.length === INITIAL_PAGE_SIZE) fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPressCoinRow = useCallback(
    (claimable: RainbowClaimable) => {
      navigate(Routes.CLAIM_AIRDROP_SHEET, { claimable });
    },
    [navigate]
  );

  const renderItem = useCallback(
    ({ item }: { item: RainbowClaimable }) => {
      return (
        <AirdropCoinRow
          address={item.asset.address}
          airdropValue={item.totalCurrencyValue.display}
          chainId={item.chainId}
          hasZeroValue={Number(item.totalCurrencyValue.amount) === 0}
          icon={item.asset.icon_url ?? item.iconUrl}
          name={item.asset.name}
          onPress={() => onPressCoinRow(item)}
          symbol={item.asset.symbol}
          uniqueId={item.asset.uniqueId}
        />
      );
    },
    [onPressCoinRow]
  );

  return (
    <LegendList
      ListEmptyComponent={EmptyState}
      ListFooterComponent={<View style={styles.listFooter} />}
      ListHeaderComponent={<View style={styles.listHeader} />}
      contentContainerStyle={styles.scrollContent}
      data={airdrops ?? EMPTY_LIST_DATA}
      drawDistance={PANEL_HEIGHT / 2}
      estimatedItemSize={COIN_ROW_HEIGHT + COIN_ROW_GAP}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="always"
      maintainVisibleContentPosition
      onEndReached={!airdrops || airdrops.length < INITIAL_PAGE_SIZE ? undefined : fetchNextPage}
      recycleItems
      renderItem={renderItem}
      renderScrollComponent={ListScrollView}
      scrollIndicatorInsets={SCROLL_INDICATOR_INSETS}
      style={styles.scrollView}
    />
  );
};

function keyExtractor(item: RainbowClaimable): string {
  return item.uniqueId;
}

const ListScrollView = ({ children, ...props }: ScrollViewProps) => {
  return IS_IOS ? (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <ScrollView refreshControl={<PullToRefresh />} {...props}>
      {children}
    </ScrollView>
  ) : (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <BottomSheetScrollView {...props} refreshControl={<PullToRefresh />}>
      {children}
    </BottomSheetScrollView>
  );
};

export const PullToRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);

    let minWaitTimeout;
    const minWait = new Promise(resolve => {
      minWaitTimeout = setTimeout(resolve, time.seconds(1));
    });
    let maxWaitTimeout;
    const maxWait = new Promise(resolve => {
      maxWaitTimeout = setTimeout(resolve, time.seconds(10));
    });

    try {
      const fetchPromise = useAirdropsStore
        .getState()
        .fetch({ pageSize: FULL_PAGE_SIZE }, { cacheTime: time.zero, staleTime: time.seconds(2), updateQueryKey: false });
      await Promise.race([Promise.all([fetchPromise, minWait]), maxWait]);
    } finally {
      clearTimeout(minWaitTimeout);
      clearTimeout(maxWaitTimeout);
      setIsRefreshing(false);
    }
  }, []);

  return <RefreshControl onRefresh={onRefresh} progressViewOffset={10} refreshing={isRefreshing} />;
};

const DARK_PANEL_COLOR = { custom: PANEL_COLOR_DARK };
const EMPTY_STATE_TEXT_COLORS = {
  dark: { custom: opacity(getColorForTheme('labelQuaternary', 'dark'), 0.2) },
  light: { custom: opacity(getColorForTheme('labelQuaternary', 'light'), 0.2) },
};

const EmptyState = () => {
  const { isDarkMode } = useColorMode();
  return (
    <View style={styles.emptyStateContainer}>
      <Stack alignHorizontal="center" space="20px">
        <IconContainer
          background={isDarkMode ? 'fillSecondary' : 'fill'}
          borderColor={isDarkMode ? 'separatorTertiary' : undefined}
          borderRadius={38}
          borderWidth={isDarkMode ? THICK_BORDER_WIDTH * 2 : undefined}
          height={76}
          width={76}
        >
          <Text align="center" color={isDarkMode ? DARK_PANEL_COLOR : WHITE_TEXT_COLOR} size="44pt" weight="heavy">
            􁎢
          </Text>
        </IconContainer>
        <Text align="center" color={EMPTY_STATE_TEXT_COLORS[isDarkMode ? 'dark' : 'light']} size="22pt" weight="heavy">
          {i18n.token_launcher.airdrops_sheet.empty_state_title()}
        </Text>
      </Stack>
    </View>
  );
};

const WHITE_TEXT_COLOR = { custom: globalColors.white100 };

const AirdropCoinRow = memo(
  function AirdropCoinRow({ airdropValue, chainId, hasZeroValue, icon, name, onPress, symbol }: AirdropClaimable) {
    return (
      <ButtonPressAnimation onPress={onPress} scaleTo={0.95} style={styles.buttonPressWrapper}>
        <View style={styles.rowContainer}>
          <RainbowCoinIcon chainId={chainId} chainSize={20} icon={icon} size={40} symbol={symbol} />

          <View style={styles.textContainer}>
            <Text color="label" numberOfLines={1} size="17pt" weight="bold">
              {symbol}
            </Text>
            <Text color="labelQuaternary" numberOfLines={1} size="13pt" weight="bold">
              {name}
            </Text>
          </View>

          <View style={styles.rowEnd}>
            <BalancePill airdropValue={airdropValue} hasZeroValue={hasZeroValue} />
          </View>
        </View>
      </ButtonPressAnimation>
    );
  },
  (prev, next) => prev.uniqueId === next.uniqueId && prev.airdropValue === next.airdropValue && prev.hasZeroValue === next.hasZeroValue
);

export const BalancePill = ({
  airdropValue,
  backgroundColor = 'fillQuaternary',
  borderColor,
  hasZeroValue,
  shadowBlur,
  shadowColor,
  shadowOpacity,
  textColor = 'label',
  zeroValueColor = 'labelTertiary',
}: {
  airdropValue: string;
  backgroundColor?: BoxProps['background'];
  borderColor?: BoxProps['borderColor'];
  hasZeroValue: boolean;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  textColor?: TextProps['color'];
  zeroValueColor?: TextProps['color'];
}) => {
  const { isDarkMode } = useColorMode();
  return (
    <Box
      alignItems="center"
      background={backgroundColor}
      borderColor={borderColor ?? (isDarkMode ? 'separatorSecondary' : 'separatorTertiary')}
      borderRadius={12}
      borderWidth={THICK_BORDER_WIDTH}
      height={28}
      justifyContent="center"
      paddingHorizontal="8px"
      pointerEvents="none"
    >
      {shadowBlur || shadowColor || shadowOpacity ? (
        <TextShadow blur={shadowBlur} color={shadowColor} shadowOpacity={shadowOpacity}>
          <Text align="center" color={hasZeroValue ? zeroValueColor : textColor} numberOfLines={1} size="17pt" weight="bold">
            {airdropValue}
          </Text>
        </TextShadow>
      ) : (
        <Text align="center" color={hasZeroValue ? zeroValueColor : textColor} numberOfLines={1} size="17pt" weight="bold">
          {airdropValue}
        </Text>
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  buttonPressWrapper: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    height: COIN_ROW_HEIGHT + COIN_ROW_GAP,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  closeButtonContainer: {
    height: CLOSE_BUTTON_SIZE,
    position: 'absolute',
    right: 24,
    top: 22,
    width: CLOSE_BUTTON_SIZE,
    zIndex: 2,
  },
  closeButton: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  closeButtonIconOffset: {
    marginTop: -2.5,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: safeAreaInsetValues.bottom,
    width: '100%',
  },
  emptyStateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 32,
  },
  footerGradient: {
    bottom: 0,
    height: 84,
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
  },
  listFooter: {
    height: 44,
    width: '100%',
  },
  listHeader: {
    height: 10,
    width: '100%',
  },
  rowContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    height: COIN_ROW_HEIGHT + COIN_ROW_GAP,
    justifyContent: 'center',
    gap: 12,
  },
  rowEnd: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    width: 'auto',
  },
  scrollContent: {
    minHeight: PANEL_HEIGHT - HEADER_HEIGHT,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    minHeight: PANEL_HEIGHT - HEADER_HEIGHT,
  },
  textContainer: {
    flex: 1,
    gap: 11,
  },
});
