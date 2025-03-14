import { RouteProp, useRoute } from '@react-navigation/native';
import { Blur, Canvas, Fill, Image, Shadow, Paint, useImage, Circle, point, Group } from '@shopify/react-native-skia';
import c from 'chroma-js';
import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { SharedValue, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { Address } from 'viem';
import { AnimatedImage } from '@/components/AnimatedComponents/AnimatedImage';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { Panel, PANEL_WIDTH, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { SheetHandleFixedToTop } from '@/components/sheet';
import {
  AnimatedText,
  Box,
  ColorModeProvider,
  Inline,
  Separator,
  Stack,
  Text,
  TextShadow,
  globalColors,
  useForegroundColor,
} from '@/design-system';
import { foregroundColors } from '@/design-system/color/palettes';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { fetchReverseRecord } from '@/handlers/ens';
import { getSizedImageUrl } from '@/handlers/imgix';
import { useCleanup, useWallets } from '@/hooks';
import { fetchENSAvatar } from '@/hooks/useENSAvatar';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import { RootStackParamList } from '@/navigation/types';
import { RainbowClaimable } from '@/resources/addys/claimables/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { darkModeThemeColors } from '@/styles/colors';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity, opacityWorklet } from '@/__swaps__/utils/swaps';
import { safeAreaInsetValues, time, watchingAlert } from '@/utils';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';
import { getCirclePath } from '@/worklets/skia';
import { AirdropGasInfo, ClaimStatus, useClaimAirdrop } from './useClaimAirdrop';
import { GasInfo } from './utils';

const COIN_ICON_SIZE = 96;
const PANEL_HEIGHT = 530;

const BUTTON_LABELS = {
  claiming: i18n.t(i18n.l.token_launcher.claim_airdrop_sheet.claiming),
  done: i18n.t(i18n.l.button.done),
  estimatingGasFee: i18n.t(i18n.l.button.loading),
  holdToClaim: `􀎽 ${i18n.t(i18n.l.token_launcher.claim_airdrop_sheet.hold_to_claim)}`,
  holdToRetry: `􀎽 ${i18n.t(i18n.l.token_launcher.claim_airdrop_sheet.hold_to_retry)}`,
  insufficientFunds: i18n.t(i18n.l.claimables.panel.insufficient_funds),
};

function getButtonLabel(claimStatus: ClaimStatus, gasInfo: GasInfo) {
  'worklet';
  switch (claimStatus) {
    case ClaimStatus.NOT_READY:
      if (!gasInfo.sufficientFundsForGas && gasInfo.gasFeeDisplay) return BUTTON_LABELS.insufficientFunds;
      return BUTTON_LABELS.estimatingGasFee;
    case ClaimStatus.INSUFFICIENT_GAS:
      return BUTTON_LABELS.insufficientFunds;
    case ClaimStatus.READY:
      return BUTTON_LABELS.holdToClaim;
    case ClaimStatus.CLAIMING:
      return BUTTON_LABELS.claiming;
    case ClaimStatus.CONFIRMED:
      return BUTTON_LABELS.done;
    case ClaimStatus.RECOVERABLE_ERROR:
      return BUTTON_LABELS.holdToRetry;
    default:
      return BUTTON_LABELS.holdToClaim;
  }
}

export const ClaimAirdropSheet = () => {
  const {
    params: { claimable },
  } = useRoute<RouteProp<RootStackParamList, 'ClaimAirdropSheet'>>();

  const [iconUrl] = useState(() => ({ uri: getSizedImageUrl(claimable.asset.icon_url, COIN_ICON_SIZE) }));
  const color = usePersistentDominantColorFromImage(claimable.asset.icon_url || iconUrl.uri);
  const highContrastColor = useMemo(() => getBrightenedColor(color), [color]);

  return (
    <ColorModeProvider value="dark">
      <View style={styles.container}>
        <TapToDismiss />

        <Panel height={PANEL_HEIGHT} innerBorderWidth={0} outerBorderColor={opacity(highContrastColor, 0.1)} outerBorderWidth={2.5}>
          <SkiaBackground color={highContrastColor} imageUrl={iconUrl.uri} originalColor={color} />
          <PanelHeader symbol={claimable.asset.symbol} />

          <Box alignItems="center" gap={28} justifyContent="center" paddingTop="24px" style={styles.flex}>
            <View style={styles.image} />
            <Stack alignHorizontal="center" space="28px">
              <PanelContent
                airdropAmount={claimable.value.claimAsset.display}
                airdropValue={claimable.value.nativeAsset.display}
                creatorAddress={claimable.creatorAddress}
                highContrastColor={highContrastColor}
              />
              <PanelFooter claimable={claimable} highContrastColor={highContrastColor} />
            </Stack>
          </Box>
        </Panel>
      </View>
    </ColorModeProvider>
  );
};

const PanelHeader = memo(function PanelHeader({ symbol }: { symbol: string }) {
  const sheetHandleColor = foregroundColors.labelQuaternary.dark;
  return (
    <Box alignItems="center" gap={24} justifyContent="center" paddingTop="32px" width="full">
      <SheetHandleFixedToTop color={sheetHandleColor} showBlur={true} />
      <Text align="center" color="label" numberOfLines={1} size="20pt" weight="heavy">
        {i18n.t(i18n.l.token_launcher.claim_airdrop_sheet.title, { symbol })}
      </Text>
      <Box width={DEVICE_WIDTH - 30 * 2}>
        <Separator color="separatorTertiary" thickness={THICK_BORDER_WIDTH} />
      </Box>
    </Box>
  );
});

const PanelContent = ({
  airdropAmount,
  airdropValue,
  creatorAddress,
  highContrastColor,
}: {
  airdropAmount: string;
  airdropValue: string;
  creatorAddress: Address;
  highContrastColor: string;
}) => {
  return (
    <>
      <Stack alignHorizontal="center" space="20px">
        <TextShadow blur={16} shadowOpacity={0.2}>
          <Text align="center" color={{ custom: highContrastColor }} numberOfLines={1} size="44pt" weight="black">
            {airdropValue}
          </Text>
        </TextShadow>

        <Box
          alignItems="center"
          backgroundColor={opacity(highContrastColor, 0.08)}
          borderColor={{ custom: opacity(highContrastColor, 0.06) }}
          borderWidth={2}
          borderRadius={22}
          height={44}
          justifyContent="center"
          paddingHorizontal="16px"
        >
          <TextShadow blur={16} color={highContrastColor} shadowOpacity={0.5}>
            <Text align="center" color={{ custom: highContrastColor }} numberOfLines={1} size="20pt" weight="heavy">
              {airdropAmount}
            </Text>
          </TextShadow>
        </Box>
      </Stack>

      <CreatedBySection creatorAddress={creatorAddress} />
    </>
  );
};

const CreatedBySection = memo(function CreatedBySection({ creatorAddress }: { creatorAddress: Address }) {
  const ensOrAddress = useSharedValue<string | null | undefined>(undefined);
  const avatarUrl = useSharedValue<string | null | undefined>(undefined);

  const revealWhenLoaded = useAnimatedStyle(() => {
    const hasLoaded = ensOrAddress.value !== undefined;
    return {
      opacity: withTiming(hasLoaded ? 1 : 0, TIMING_CONFIGS.slowestFadeConfig),
      transform: [{ translateY: withTiming(hasLoaded ? 0 : 10, TIMING_CONFIGS.slowestFadeConfig) }],
    };
    ``;
  });

  useEffect(() => {
    fetchAndSetEnsData({ address: creatorAddress, avatarUrl, ensOrAddress });
  }, [avatarUrl, creatorAddress, ensOrAddress]);

  return (
    <Animated.View style={revealWhenLoaded}>
      <Inline alignHorizontal="center" alignVertical="center" space={{ custom: 7 }}>
        <CreatorAvatar avatarUrl={avatarUrl} creatorAddress={creatorAddress} />
        <Inline alignHorizontal="center" alignVertical="center" space="3px">
          <Text align="center" color="labelQuaternary" size="13pt" weight="semibold">
            {i18n.t(i18n.l.token_launcher.claim_airdrop_sheet.gifted_to)}
          </Text>
          <Text align="center" color="labelTertiary" size="13pt" weight="bold">
            {i18n.t(i18n.l.token_launcher.claim_airdrop_sheet.you)}
          </Text>
          <Text align="center" color="labelQuaternary" size="13pt" weight="semibold">
            {i18n.t(i18n.l.token_launcher.claim_airdrop_sheet.by)}
          </Text>
          <CreatorAddress ensOrAddress={ensOrAddress} />
        </Inline>
      </Inline>
    </Animated.View>
  );
});

const CreatorAddress = ({ ensOrAddress }: { ensOrAddress: SharedValue<string | null | undefined> }) => {
  return (
    <AnimatedText align="center" color="labelTertiary" size="13pt" weight="bold">
      {ensOrAddress}
    </AnimatedText>
  );
};

const CreatorAvatar = ({ avatarUrl, creatorAddress }: { avatarUrl: SharedValue<string | null | undefined>; creatorAddress: string }) => {
  const [{ color, emoji }] = useState(() => ({
    color: darkModeThemeColors.avatarBackgrounds[addressHashedColorIndex(creatorAddress) ?? 0],
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
    <View style={styles.avatarWrapper}>
      <AnimatedImage url={avatarUrl} style={[styles.avatar, imageAvatarStyle]} />
      <Animated.View style={[styles.avatar, emojiAvatarStyle]}>
        <Box alignItems="center" backgroundColor={color} borderRadius={8} height={16} justifyContent="center" width={16}>
          <Text align="center" color="label" size="icon 8px" style={{ lineHeight: 16 }} weight="bold">
            {emoji}
          </Text>
        </Box>
      </Animated.View>
    </View>
  );
};

const PanelFooter = ({ claimable, highContrastColor }: { claimable: RainbowClaimable; highContrastColor: string }) => {
  const { goBack } = useNavigation();
  const { isReadOnlyWallet } = useWallets();
  const { claimAirdropWorklet, claimStatus, gasInfo } = useClaimAirdrop(claimable);

  const claimAirdrop = useCallback(() => {
    'worklet';
    if (isReadOnlyWallet) {
      runOnJS(watchingAlert)();
      return;
    }
    if (claimStatus.value === ClaimStatus.READY || claimStatus.value === ClaimStatus.RECOVERABLE_ERROR) {
      claimAirdropWorklet();
    } else if (claimStatus.value === ClaimStatus.CONFIRMED) {
      goBack();
    }
  }, [claimAirdropWorklet, claimStatus, goBack, isReadOnlyWallet]);

  return (
    <PanelFooterContent
      chainLabel={useBackendNetworksStore(state => state.getChainsLabel()[claimable.asset.chainId])}
      claimAirdrop={claimAirdrop}
      claimStatus={claimStatus}
      gasInfo={gasInfo}
      highContrastColor={highContrastColor}
    />
  );
};

const PanelFooterContent = ({
  chainLabel,
  claimAirdrop,
  claimStatus,
  gasInfo,
  highContrastColor,
}: {
  chainLabel: string;
  claimAirdrop: () => void;
  claimStatus: SharedValue<ClaimStatus>;
  gasInfo: SharedValue<AirdropGasInfo>;
  highContrastColor: string;
}) => {
  const { goBack } = useNavigation();

  const labelTertiary = useForegroundColor('labelTertiary');
  const red = useForegroundColor('red');

  const buttonLabel = useDerivedValue(() => getButtonLabel(claimStatus.value, gasInfo.value));
  const gasFeeDisplay = useDerivedValue(() => gasInfo.value.gasFeeDisplay);

  const buttonStyle = useAnimatedStyle(() => {
    const shouldEnable =
      claimStatus.value === ClaimStatus.READY ||
      claimStatus.value === ClaimStatus.RECOVERABLE_ERROR ||
      claimStatus.value === ClaimStatus.CONFIRMED;
    return {
      opacity: withTiming(shouldEnable ? 1 : 0.5, TIMING_CONFIGS.slowestFadeConfig),
      pointerEvents: shouldEnable ? 'auto' : 'none',
    };
  });

  const gasFeeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(gasInfo.value.gasFeeDisplay ? 1 : 0, TIMING_CONFIGS.slowestFadeConfig),
    transform: [{ translateY: withTiming(gasInfo.value.gasFeeDisplay ? 0 : 10, TIMING_CONFIGS.slowestFadeConfig) }],
  }));

  const insufficientFundsTextColor = useAnimatedStyle(() => ({
    color: claimStatus.value === ClaimStatus.INSUFFICIENT_GAS ? red : labelTertiary,
  }));

  const onPress = useCallback(() => {
    'worklet';
    if (claimStatus.value === ClaimStatus.CONFIRMED) runOnJS(goBack)();
  }, [claimStatus, goBack]);

  return (
    <Box alignItems="center" gap={24} justifyContent="center" paddingBottom="24px" paddingTop="16px">
      <Box width={DEVICE_WIDTH - 30 * 2}>
        <Separator color="separatorTertiary" thickness={THICK_BORDER_WIDTH} />
      </Box>

      <GestureHandlerButton
        longPressDuration={400}
        onLongPressWorklet={claimAirdrop}
        onPressWorklet={onPress}
        scaleTo={0.925}
        style={[{ backgroundColor: highContrastColor }, styles.submitButton, buttonStyle]}
      >
        <AnimatedText
          align="center"
          color={{ custom: getHighContrastTextColorWorklet(highContrastColor, 3) }}
          size="20pt"
          style={styles.flex}
          weight="heavy"
        >
          {buttonLabel}
        </AnimatedText>
      </GestureHandlerButton>

      <Animated.View style={[styles.gasFeeContainer, gasFeeStyle]}>
        <AnimatedTextIcon
          color="labelTertiary"
          height={9}
          size="icon 10px"
          textStyle={insufficientFundsTextColor}
          weight="heavy"
          width={14}
        >
          􀵟
        </AnimatedTextIcon>
        <AnimatedText align="center" color="labelTertiary" size="13pt" style={insufficientFundsTextColor} weight="bold">
          {gasFeeDisplay}
        </AnimatedText>
        <Text align="center" color="labelQuaternary" size="13pt" weight="semibold">
          {i18n.t(i18n.l.token_launcher.claim_airdrop_sheet.to_claim_on, { network: chainLabel })}
        </Text>
      </Animated.View>
    </Box>
  );
};

const COLORS = {
  coinIconDropShadow: opacity(globalColors.grey100, 0.28),
  coinIconOuterCircle: opacity(globalColors.white100, 0.3),
  white60: opacity(globalColors.white100, 0.5),
};

const COIN_ICON_Y_POSITION = 147;

const SkiaBackground = memo(function SkiaBackground({
  color,
  imageUrl,
  originalColor,
}: {
  color: string | undefined;
  imageUrl: string | undefined;
  originalColor: string | undefined;
}) {
  const [coinIconPath] = useState(() => getCirclePath(point(PANEL_WIDTH / 2, COIN_ICON_Y_POSITION), COIN_ICON_SIZE / 2));
  const image = useImage(imageUrl);

  const imageOpacity = useDerivedValue(() => (image ? withTiming(1, TIMING_CONFIGS.slowerFadeConfig) : 0));
  const shadowOpacity = useDerivedValue(() => (color ? withTiming(0.44, TIMING_CONFIGS.slowerFadeConfig) : 0));
  const shadowColor = useDerivedValue(() => (color ? opacityWorklet(color, shadowOpacity.value) : 'rgba(0, 0, 0, 0)'));

  useCleanup(() => coinIconPath?.dispose?.());
  useCleanup(() => image?.dispose?.(), [image]);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Group>
        {/* Blurred background image */}
        <Fill color={originalColor} />
        <Image
          height={styles.backgroundImage.height}
          image={image}
          opacity={imageOpacity}
          width={styles.backgroundImage.width}
          x={(PANEL_WIDTH - styles.backgroundImage.width) / 2}
          y={(PANEL_HEIGHT - styles.backgroundImage.height) / 2}
        />
        <Blur blur={100} />
        <Fill color="rgba(26, 26, 26, 0.75)" />
      </Group>

      <Group opacity={imageOpacity}>
        {/* Coin icon drop shadow */}
        <Circle color="transparent" cx={PANEL_WIDTH / 2} cy={COIN_ICON_Y_POSITION} r={COIN_ICON_SIZE / 2}>
          <Paint antiAlias blendMode="overlay" dither>
            {color && <Shadow blur={8} color={shadowColor} dx={0} dy={8} shadowOnly />}
          </Paint>
        </Circle>

        {/* Coin icon image */}
        <Image
          clip={coinIconPath}
          fit="cover"
          height={COIN_ICON_SIZE}
          image={image}
          width={COIN_ICON_SIZE}
          x={PANEL_WIDTH / 2 - COIN_ICON_SIZE / 2}
          y={COIN_ICON_Y_POSITION - COIN_ICON_SIZE / 2}
        />

        {/* Coin icon inner shadows */}
        <Circle color="transparent" cx={PANEL_WIDTH / 2} cy={COIN_ICON_Y_POSITION} r={COIN_ICON_SIZE / 2}>
          <Shadow blur={2} color={globalColors.grey100} dx={0} dy={-2} inner shadowOnly />
          <Paint blendMode="plus" antiAlias dither>
            <Shadow blur={3} color={COLORS.white60} dx={0} dy={2} inner shadowOnly />
          </Paint>
        </Circle>
      </Group>
    </Canvas>
  );
});

function getBrightenedColor(color: string | undefined): string {
  let brightenedColor = color || globalColors.blue60;
  const contrast = c.contrast(brightenedColor, '#191A1C');

  if (contrast < 10) {
    brightenedColor = c(brightenedColor).brighten(2.25).saturate(2).css();
    return brightenedColor;
  } else return brightenedColor;
}

function getFallbackAddress(address: Address) {
  return formatAddressForDisplay(address, 4, 6);
}

async function fetchAndSetEnsData({
  address,
  avatarUrl,
  ensOrAddress,
}: {
  address: Address;
  avatarUrl: SharedValue<string | null | undefined>;
  ensOrAddress: SharedValue<string | null | undefined>;
}) {
  let resolved = false;
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<null>(resolve => {
    timeoutId = setTimeout(() => resolve(null), time.seconds(3));
  });

  try {
    await Promise.race([
      fetchReverseRecord(address).then(async name => {
        if (!name) {
          avatarUrl.value = null;
          ensOrAddress.value = getFallbackAddress(address);
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }
        resolved = true;
        ensOrAddress.value = name;
        const avatar = (await fetchENSAvatar(name, { cacheFirst: true }))?.imageUrl;
        const sizedImageUrl = avatar ? getSizedImageUrl(avatar, 16) : null;
        avatarUrl.value = sizedImageUrl || null;
        if (timeoutId) clearTimeout(timeoutId);
        return;
      }),
      timeoutPromise.then(() => {
        if (resolved) return;
        avatarUrl.value = null;
        ensOrAddress.value = getFallbackAddress(address);
      }),
    ]);
  } catch (error) {
    if (resolved) return;
    ensOrAddress.value = getFallbackAddress(address);
    avatarUrl.value = null;
    if (timeoutId) clearTimeout(timeoutId);
  }
}

const styles = StyleSheet.create({
  avatar: {
    height: 16,
    overflow: 'hidden',
    position: 'absolute',
    width: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    backgroundColor: getColorForTheme('fillTertiary', 'dark'),
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    marginVertical: -4,
    overflow: 'hidden',
    position: 'relative',
    width: 16,
  },
  backgroundFill: {
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.75)',
    bottom: 0,
    height: '100%',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    zIndex: 3,
  },
  backgroundImage: {
    height: PANEL_HEIGHT + PANEL_WIDTH,
    width: PANEL_WIDTH + PANEL_WIDTH,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    height: DEVICE_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: safeAreaInsetValues.bottom,
    pointerEvents: 'box-none',
  },
  fill: {
    alignItems: 'center',
    bottom: 0,
    height: '100%',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
  flex: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  gasFeeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  image: {
    height: COIN_ICON_SIZE,
    opacity: 0,
    width: COIN_ICON_SIZE,
  },
  scrollContent: {
    paddingBottom: 44,
    paddingTop: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 28,
  },
  separatorContainer: {
    marginTop: -16,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 6,
    height: 48,
    justifyContent: 'center',
    width: DEVICE_WIDTH - 30 * 2,
  },
});
