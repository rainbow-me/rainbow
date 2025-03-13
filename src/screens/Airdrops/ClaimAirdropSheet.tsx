import { RouteProp, useRoute } from '@react-navigation/native';
import { Blur, Canvas, Fill, Image, Shadow, Paint, useImage, Circle, point, Group } from '@shopify/react-native-skia';
import c from 'chroma-js';
import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { SharedValue, runOnJS, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { Panel, PANEL_WIDTH, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { ImgixImage } from '@/components/images';
import { SheetHandleFixedToTop } from '@/components/sheet';
import {
  AnimatedText,
  Bleed,
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
import { getSizedImageUrl } from '@/handlers/imgix';
import { useCleanup, useWallets } from '@/hooks';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import { RootStackParamList } from '@/navigation/types';
import { RainbowClaimable } from '@/resources/addys/claimables/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity, opacityWorklet } from '@/__swaps__/utils/swaps';
import { safeAreaInsetValues, watchingAlert } from '@/utils';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';
import { getCirclePath } from '@/worklets/skia';
import { AirdropGasInfo, ClaimStatus, useClaimAirdrop } from './useClaimAirdrop';
import { GasInfo } from './utils';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { fetchENSAvatar } from '@/hooks/useENSAvatar';

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
    case ClaimStatus.SUCCESS:
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

const PanelContent = memo(function PanelContent({
  airdropAmount,
  airdropValue,
  creatorAddress,
  highContrastColor,
}: {
  airdropAmount: string;
  airdropValue: string;
  creatorAddress: string;
  highContrastColor: string;
}) {
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

      <Inline alignHorizontal="center" alignVertical="center" space={{ custom: 7 }}>
        <Avatar creatorAddress={creatorAddress} />
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
          <Text align="center" color="labelTertiary" size="13pt" weight="bold">
            {formatAddressForDisplay(creatorAddress, 4, 6)}
          </Text>
        </Inline>
      </Inline>
    </>
  );
});

const PanelFooter = ({ claimable, highContrastColor }: { claimable: RainbowClaimable; highContrastColor: string }) => {
  const { goBack } = useNavigation();
  const { isReadOnlyWallet } = useWallets();
  const { claimAirdropWorklet, claimStatus, gasInfo } = useClaimAirdrop(claimable);

  const handleClaim = useCallback(() => {
    'worklet';
    if (isReadOnlyWallet) {
      runOnJS(watchingAlert)();
      return;
    }
    if (claimStatus.value === ClaimStatus.READY || claimStatus.value === ClaimStatus.RECOVERABLE_ERROR) {
      claimAirdropWorklet();
    } else if (claimStatus.value === ClaimStatus.SUCCESS) {
      goBack();
    }
  }, [claimAirdropWorklet, claimStatus, goBack, isReadOnlyWallet]);

  return (
    <PanelFooterContent
      chainLabel={useBackendNetworksStore(state => state.getChainsLabel()[claimable.asset.chainId])}
      claimStatus={claimStatus}
      gasInfo={gasInfo}
      handleClaim={handleClaim}
      highContrastColor={highContrastColor}
    />
  );
};

const PanelFooterContent = memo(function PanelFooterContent({
  chainLabel,
  claimStatus,
  gasInfo,
  handleClaim,
  highContrastColor,
}: {
  chainLabel: string;
  claimStatus: SharedValue<ClaimStatus>;
  gasInfo: SharedValue<AirdropGasInfo>;
  handleClaim: () => void;
  highContrastColor: string;
}) {
  const { goBack } = useNavigation();

  const labelTertiary = useForegroundColor('labelTertiary');
  const red = useForegroundColor('red');

  const buttonLabel = useDerivedValue(() => getButtonLabel(claimStatus.value, gasInfo.value));
  const gasFeeDisplay = useDerivedValue(() => gasInfo.value.gasFeeDisplay);

  const buttonStyle = useAnimatedStyle(() => {
    const isButtonDisabled =
      claimStatus.value !== ClaimStatus.READY &&
      claimStatus.value !== ClaimStatus.SUCCESS &&
      claimStatus.value !== ClaimStatus.RECOVERABLE_ERROR;
    return {
      opacity: withTiming(isButtonDisabled ? 0.5 : 1, TIMING_CONFIGS.slowFadeConfig),
      pointerEvents: isButtonDisabled ? 'none' : 'auto',
    };
  });

  const gasFeeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(gasInfo.value.gasFeeDisplay ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
    transform: [{ translateY: withSpring(gasInfo.value.gasFeeDisplay ? 0 : -12, SPRING_CONFIGS.springConfig) }],
  }));

  const insufficientFundsTextColor = useAnimatedStyle(() => ({
    color: claimStatus.value === ClaimStatus.INSUFFICIENT_GAS ? red : labelTertiary,
  }));

  const onPress = useCallback(() => {
    'worklet';
    if (claimStatus.value === ClaimStatus.SUCCESS) runOnJS(goBack)();
  }, [claimStatus, goBack]);

  return (
    <Box alignItems="center" gap={24} justifyContent="center" paddingBottom="24px" paddingTop="16px">
      <Box width={DEVICE_WIDTH - 30 * 2}>
        <Separator color="separatorTertiary" thickness={THICK_BORDER_WIDTH} />
      </Box>

      <GestureHandlerButton
        longPressDuration={400}
        onLongPressWorklet={handleClaim}
        onPressWorklet={onPress}
        scaleTo={0.925}
        style={[{ backgroundColor: highContrastColor }, styles.submitButton, buttonStyle]}
      >
        <AnimatedText align="center" color={{ custom: getHighContrastTextColorWorklet(highContrastColor, 3) }} size="20pt" weight="heavy">
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
});

const Avatar = memo(function Avatar({ creatorAddress }: { creatorAddress: string }) {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchENSAvatar(creatorAddress, { swallowError: true }).then(data => {
      if (data?.imageUrl) setAvatarUrl(data.imageUrl);
    });
  }, [creatorAddress]);

  return (
    <Bleed vertical="6px">
      <ImgixImage enableFasterImage size={16} source={{ uri: getSizedImageUrl(avatarUrl, 16) }} style={styles.avatar} />
    </Bleed>
  );
});

const COLORS = {
  coinIconDropShadow: opacity(globalColors.grey100, 0.28),
  coinIconOuterCircle: opacity(globalColors.white100, 0.3),
  white60: opacity(globalColors.white100, 0.5),
};

const COIN_ICON_Y_POSITION = 147;

const SkiaBackground = memo(function BackgroundBlur({
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

  const imageOpacity = useDerivedValue(() => (image ? withTiming(1, TIMING_CONFIGS.slowFadeConfig) : 0));
  const shadowOpacity = useDerivedValue(() => (color ? withTiming(0.44, TIMING_CONFIGS.slowFadeConfig) : 0));
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

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 8,
    height: 16,
    overflow: 'hidden',
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
