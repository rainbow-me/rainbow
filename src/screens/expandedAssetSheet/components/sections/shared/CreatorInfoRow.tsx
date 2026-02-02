import React, { memo, useEffect } from 'react';
import { Address } from 'viem';
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
import { View, StyleSheet } from 'react-native';

import { AnimatedImage } from '@/components/AnimatedComponents/AnimatedImage';
import { AnimatedText, Bleed, Box, Text, TextIcon, TextShadow, useBackgroundColor } from '@/design-system';
import { Row } from '@/screens/expandedAssetSheet/components/shared/Row';
import { useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { fetchAndSetEnsData } from '@/screens/Airdrops/ClaimAirdropSheet';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { sliderConfig, pulsingConfig } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/data/opacity';
import { useTheme } from '@/theme';
import { IS_IOS } from '@/env';
import { useStableValue } from '@/hooks/useStableValue';

type CreatorInfoRowProps = {
  address?: Address | string | null;
  highlighted?: boolean;
  icon: string;
  label: string;
};

const LAYOUT_ANIMATION = FadeIn.duration(160);

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
  const { color, emoji } = useStableValue(() => ({
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

export const CreatorInfoRow = memo(function CreatorInfoRow({ address, highlighted = true, icon, label }: CreatorInfoRowProps) {
  const creatorAddress = address ?? '';
  const loading = useSharedValue(true);
  const ensOrAddress = useSharedValue<string | null | undefined>(undefined);
  const avatarUrl = useSharedValue<string | null | undefined>(undefined);

  useEffect(() => {
    if (!creatorAddress) return;
    const getEnsData = async () => {
      await fetchAndSetEnsData({ address: creatorAddress as Address, avatarUrl, ensOrAddress });
      loading.value = false;
    };
    getEnsData();
  }, [avatarUrl, creatorAddress, ensOrAddress, loading]);

  if (!creatorAddress) return null;

  return (
    <Row highlighted={highlighted}>
      <Box width="full">
        <Animated.View style={{ width: '100%', flexDirection: 'row', gap: 12, alignItems: 'center' }} entering={LAYOUT_ANIMATION}>
          <TextIcon color="labelSecondary" containerSize={20} size="icon 15px" weight="medium">
            {icon}
          </TextIcon>
          <Text style={{ flex: 1 }} numberOfLines={1} ellipsizeMode="tail" color="labelSecondary" weight="medium" size="17pt">
            {label}
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
