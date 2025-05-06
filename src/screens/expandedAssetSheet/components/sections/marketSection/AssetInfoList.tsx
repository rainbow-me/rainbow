import React, { memo, useEffect, useMemo, useState } from 'react';
import * as i18n from '@/languages';
import { Box, Text, TextIcon, TextShadow, useColorMode, useBackgroundColor, AnimatedText, Bleed } from '@/design-system';
import { bigNumberFormat } from '@/helpers/bigNumberFormat';
import { Row } from '../../shared/Row';
import { abbreviateNumber } from '@/helpers/utilities';
import Animated, {
  FadeIn,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { formatDate } from '@/utils/formatDate';
import { useAccountSettings } from '@/hooks';
import { opacity } from '@/__swaps__/utils/swaps';
import { ShimmerAnimation } from '@/components/animations';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import { fetchAndSetEnsData } from '@/screens/Airdrops/ClaimAirdropSheet';
import { useTheme } from '@/theme';
import { IS_IOS } from '@/env';
import { View, StyleSheet } from 'react-native';
import { AnimatedImage } from '@/components/AnimatedComponents/AnimatedImage';
import { Address } from 'viem';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { sliderConfig, pulsingConfig } from '@/__swaps__/screens/Swap/constants';

const DEFAULT_VISIBLE_ITEM_COUNT = 3;
const LAYOUT_ANIMATION = FadeIn.duration(160);

const SkeletonRow = ({ width, height }: { width: number; height: number }) => {
  const { isDarkMode } = useColorMode();
  const { accentColors } = useExpandedAssetSheetContext();
  const fillTertiary = useBackgroundColor('fillTertiary');
  const shimmerColor = opacity(fillTertiary, isDarkMode ? 0.025 : 0.06);

  return (
    <Box
      backgroundColor={accentColors.surfaceSecondary}
      height={{ custom: height }}
      width={{ custom: width }}
      borderRadius={18}
      style={{ overflow: 'hidden' }}
    >
      <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
    </Box>
  );
};

function AssetInfoItem({
  accentColor,
  title,
  value,
  icon,
  highlighted,
}: {
  accentColor: string;
  title: string;
  value: string;
  icon: string;
  highlighted: boolean;
}) {
  return (
    <Row highlighted={highlighted}>
      <Box width="full">
        <Animated.View style={{ width: '100%', flexDirection: 'row', gap: 12, alignItems: 'center' }} entering={LAYOUT_ANIMATION}>
          <TextIcon color="labelSecondary" containerSize={20} size="icon 15px" weight="medium">
            {icon}
          </TextIcon>
          <Text style={{ flex: 1 }} numberOfLines={1} ellipsizeMode="tail" color="labelSecondary" weight="medium" size="17pt">
            {title}
          </Text>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text align="right" color={{ custom: accentColor }} weight="semibold" size="17pt">
              {value}
            </Text>
          </TextShadow>
        </Animated.View>
      </Box>
    </Row>
  );
}

const CreatorAddress = ({
  ensOrAddress,
  creatorAddress,
  loading,
}: {
  ensOrAddress: SharedValue<string | null | undefined>;
  creatorAddress: string;
  loading: SharedValue<boolean>;
}) => {
  const { accentColors } = useExpandedAssetSheetContext();

  const loadingColor = opacity(accentColors.color, 0.3);
  const ensAddressOrFallback = useDerivedValue(() => {
    if (ensOrAddress.value) return ensOrAddress.value;
    return formatAddressForDisplay(creatorAddress, 4, 6);
  });

  const animatedTextOpacity = useAnimatedStyle(() => ({
    color: withTiming(loading.value ? loadingColor : accentColors.color, TIMING_CONFIGS.slowFadeConfig),
    opacity: loading.value
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig),
  }));

  return (
    <TextShadow blur={12} shadowOpacity={0.24}>
      <AnimatedText align="right" size="17pt" weight="semibold" style={animatedTextOpacity}>
        {ensAddressOrFallback}
      </AnimatedText>
    </TextShadow>
  );
};

const CreatorAvatar = ({ avatarUrl, creatorAddress }: { avatarUrl: SharedValue<string | null | undefined>; creatorAddress: string }) => {
  const { colors } = useTheme();
  const fillTertiary = useBackgroundColor('fillTertiary');
  const [{ color, emoji }] = useState(() => ({
    color: colors.avatarBackgrounds[addressHashedColorIndex(creatorAddress) ?? 0],
    emoji: addressHashedEmoji(creatorAddress),
  }));

  const emojiAvatarStyle = useAnimatedStyle(() => {
    const shouldDisplay = avatarUrl.value === null;
    return { opacity: withTiming(shouldDisplay ? 1 : 0, TIMING_CONFIGS.slowerFadeConfig) };
  });

  const imageAvatarStyle = useAnimatedStyle(() => {
    const shouldDisplay = !!avatarUrl.value;
    return { opacity: withTiming(shouldDisplay ? 1 : 0, TIMING_CONFIGS.slowerFadeConfig) };
  });

  return (
    <Bleed vertical="8px">
      <View style={[styles.avatarWrapper, { backgroundColor: fillTertiary }]}>
        <AnimatedImage url={avatarUrl} style={[styles.avatar, imageAvatarStyle]} />
        <Animated.View style={[styles.avatar, emojiAvatarStyle]}>
          <Box alignItems="center" backgroundColor={color} borderRadius={8} height={16} justifyContent="center" width={16}>
            <Text align="center" color="label" size="icon 8px" style={{ lineHeight: 16 }} weight="bold">
              {emoji}
            </Text>
          </Box>
        </Animated.View>
      </View>
    </Bleed>
  );
};

const styles = StyleSheet.create({
  avatar: {
    height: 16,
    overflow: 'hidden',
    position: 'absolute',
    width: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    marginTop: IS_IOS ? undefined : -3,
    overflow: 'hidden',
    position: 'relative',
    width: 16,
  },
});

const CreatedBySection = memo(function CreatedBySection() {
  const { assetMetadata: metadata } = useExpandedAssetSheetContext();

  const creatorAddress = (metadata?.rainbowTokenDetails?.onchainData?.creatorAddress ?? '') as Address;
  const loading = useSharedValue(true);
  const ensOrAddress = useSharedValue<string | null | undefined>(undefined);
  const avatarUrl = useSharedValue<string | null | undefined>(undefined);

  useEffect(() => {
    const getEnsData = async () => {
      await fetchAndSetEnsData({ address: creatorAddress, avatarUrl, ensOrAddress });
      loading.value = false;
    };
    getEnsData();
  }, [avatarUrl, creatorAddress, ensOrAddress]);

  if (!creatorAddress) return null;

  return (
    <Row highlighted>
      <Box width="full">
        <Animated.View style={{ width: '100%', flexDirection: 'row', gap: 12, alignItems: 'center' }} entering={LAYOUT_ANIMATION}>
          <TextIcon color="labelSecondary" containerSize={20} size="icon 15px" weight="medium">
            􀫸
          </TextIcon>
          <Text style={{ flex: 1 }} numberOfLines={1} ellipsizeMode="tail" color="labelSecondary" weight="medium" size="17pt">
            {i18n.t(i18n.l.expanded_state.sections.market_stats.created_by)}
          </Text>
          <Box flexDirection="row" alignItems="center" gap={6}>
            <CreatorAvatar avatarUrl={avatarUrl} creatorAddress={creatorAddress} />
            <CreatorAddress ensOrAddress={ensOrAddress} creatorAddress={creatorAddress} loading={loading} />
          </Box>
        </Animated.View>
      </Box>
    </Row>
  );
});

export function AssetInfoList() {
  const { nativeCurrency } = useAccountSettings();
  const { accentColors, assetMetadata: metadata, basicAsset: asset, isLoadingMetadata } = useExpandedAssetSheetContext();

  const isExpanded = useSharedValue(true);

  const moreText = i18n.t(i18n.l.button.more);
  const lessText = i18n.t(i18n.l.button.less);

  const expandedText = useDerivedValue(() => {
    return isExpanded.value ? lessText : moreText;
  });

  const expandedTextIcon = useDerivedValue(() => {
    return isExpanded.value ? ('􀆇' as string) : ('􀆈' as string);
  });

  const expandedItemsContainerStyle = useAnimatedStyle(() => {
    return {
      display: isExpanded.value ? 'flex' : 'none',
      opacity: withSpring(isExpanded.value ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig),
      gap: 4,
    };
  });

  const hasCreatedBySection = useMemo(() => {
    return metadata?.rainbowTokenDetails?.onchainData?.creatorAddress !== undefined;
  }, [metadata]);

  const assetInfoItems = useMemo(() => {
    const items: { title: string; value: string; icon: string }[] = [];

    if (!metadata) return items;

    if (metadata.marketCap) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.market_cap),
        value: bigNumberFormat(metadata.marketCap, nativeCurrency, true),
        icon: '􁎢',
      });
    }
    if (metadata.volume1d) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.volume_24_hours),
        value: bigNumberFormat(metadata.volume1d, nativeCurrency, true),
        icon: '􀣉',
      });
    }
    if (asset.creationDate) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.created),
        value: formatDate(asset.creationDate, 'minutes'),
        icon: '􁖩',
      });
    }
    if (metadata.fullyDilutedValuation) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.fully_diluted_valuation),
        value: bigNumberFormat(metadata.fullyDilutedValuation, nativeCurrency, true),
        icon: '􀑀',
      });
    }
    // BLOCKED: Do not currently have rank data
    // if (metadata.rank) {
    //   items.push({
    //     title: i18n.t(i18n.l.expanded_state.sections.market_stats.rank),
    //     value: `#${metadata.rank}`,
    //     icon: '􀄯',
    //   });
    // }
    if (metadata.circulatingSupply) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.circulating_supply),
        value: abbreviateNumber(metadata.circulatingSupply),
        icon: '􂣽',
      });
    }
    if (metadata.totalSupply) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.max_supply),
        value: abbreviateNumber(metadata.totalSupply),
        icon: '􀅃',
      });
    }

    return items;
  }, [metadata, asset, nativeCurrency]);

  const ITEMS_COUNT = hasCreatedBySection ? DEFAULT_VISIBLE_ITEM_COUNT - 1 : DEFAULT_VISIBLE_ITEM_COUNT;

  const isExpansionRowHighlighted = useDerivedValue(() => {
    const expandedAmount = hasCreatedBySection ? assetInfoItems.length - 1 : assetInfoItems.length;
    const lastVisibleIndex = isExpanded.value ? expandedAmount : ITEMS_COUNT;
    return lastVisibleIndex % 2 === 0;
  });

  return (
    <Box>
      {assetInfoItems.length === 0 && !isLoadingMetadata && (
        <Box justifyContent="center" alignItems="center" paddingVertical="24px" style={{ opacity: 0.8 }}>
          <Text align="center" color="labelQuaternary" size="17pt" weight="heavy">
            {i18n.t(i18n.l.expanded_state.asset.no_data_available)}
          </Text>
        </Box>
      )}
      {assetInfoItems.length === 0 && isLoadingMetadata && (
        <Box gap={4}>
          {Array.from({ length: DEFAULT_VISIBLE_ITEM_COUNT }).map((_, index) => (
            <Row highlighted={index % 2 === 0} key={index}>
              <SkeletonRow width={120} height={20} />
              <SkeletonRow width={50} height={20} />
            </Row>
          ))}
        </Box>
      )}
      {assetInfoItems.length > 0 && (
        <Box gap={4} marginBottom={assetInfoItems.length % 2 === 0 ? '-12px' : undefined}>
          {hasCreatedBySection && <CreatedBySection />}
          {assetInfoItems.slice(0, ITEMS_COUNT).map((item, index) => (
            <AssetInfoItem
              key={item.title}
              accentColor={accentColors.color}
              title={item.title}
              value={item.value}
              icon={item.icon}
              highlighted={hasCreatedBySection ? index % 2 !== 0 : index % 2 === 0}
            />
          ))}
          <Animated.View style={expandedItemsContainerStyle}>
            {assetInfoItems.slice(ITEMS_COUNT).map(item => {
              const index = assetInfoItems.indexOf(item);
              return (
                <AssetInfoItem
                  key={item.title}
                  accentColor={accentColors.color}
                  title={item.title}
                  value={item.value}
                  icon={item.icon}
                  highlighted={(hasCreatedBySection ? index + 1 : index) % 2 === 0}
                />
              );
            })}
          </Animated.View>
        </Box>
      )}
      {assetInfoItems.length > ITEMS_COUNT && (
        <GestureHandlerButton
          scaleTo={0.96}
          hapticTrigger="tap-end"
          style={{ marginTop: 4 }}
          onPressWorklet={() => {
            'worklet';
            isExpanded.value = !isExpanded.value;
          }}
        >
          <Row highlighted={isExpansionRowHighlighted}>
            <Box width="full" flexDirection="row" alignItems="center" gap={12}>
              <Box
                width={{ custom: 20 }}
                height={{ custom: 20 }}
                borderRadius={40}
                style={{ backgroundColor: accentColors.border }}
                borderWidth={1.33}
                borderColor={{ custom: accentColors.opacity4 }}
                alignItems="center"
                justifyContent="center"
              >
                <AnimatedText weight="black" align="center" size="icon 10px" color={{ custom: accentColors.color }}>
                  {expandedTextIcon}
                </AnimatedText>
              </Box>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <AnimatedText weight="semibold" size="17pt" align="center" color={{ custom: accentColors.color }}>
                  {expandedText}
                </AnimatedText>
              </TextShadow>
            </Box>
          </Row>
        </GestureHandlerButton>
      )}
    </Box>
  );
}
