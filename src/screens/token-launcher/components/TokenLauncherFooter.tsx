import React, { useCallback, useState } from 'react';
import * as i18n from '@/languages';
import { Box, Inline, Separator, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { NavigationSteps, useTokenLauncherStore } from '../state/tokenLauncherStore';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { STEP_TRANSITION_DURATION } from '../constants';
import { Keyboard, Share } from 'react-native';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { GasButton } from './gas/GasButton';
import { useAccountSettings, useBiometryType, useWallets } from '@/hooks';
import { BiometryTypes } from '@/helpers';
import { HoldToActivateButton } from './HoldToActivateButton';
import { IS_ANDROID } from '@/env';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useNavigation } from '@/navigation';

import { loadWallet } from '@/model/wallet';
import { Wallet } from '@ethersproject/wallet';
import { getProvider } from '@/handlers/web3';
import { useTokenLaunchGasOptions } from '../hooks/useTokenLaunchGasOptions';
import { colors } from '@/styles';

import { useTokenLauncher } from '@/hooks/useTokenLauncher';
import { staleBalancesStore } from '@/state/staleBalances';
import { buildTokenDeeplink } from '@/handlers/deeplinks';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { analyticsV2 } from '@/analytics';
import { logger, RainbowError } from '@/logger';
import showWalletErrorAlert from '@/helpers/support';
import { LedgerSigner } from '@/handlers/LedgerSigner';

// height + top padding + bottom padding
export const FOOTER_HEIGHT = 48 + 16 + 8;

function HoldToCreateButton() {
  const { accentColors } = useTokenLauncherContext();
  const createToken = useTokenLauncherStore(state => state.createToken);
  const setStep = useTokenLauncherStore(state => state.setStep);
  const gasSpeed = useTokenLauncherStore(state => state.gasSpeed);
  const chainId = useTokenLauncherStore(state => state.chainId);
  const { isHardwareWallet } = useWallets();
  const biometryType = useBiometryType();
  const { accountAddress } = useAccountSettings();
  const { transactionOptions } = useTokenLaunchGasOptions({
    chainId,
    gasSpeed,
  });

  const { addStaleBalance } = staleBalancesStore.getState();
  const [isProcessing, setIsProcessing] = useState(false);

  const isLongPressAvailableForBiometryType =
    biometryType === BiometryTypes.FaceID || biometryType === BiometryTypes.Face || biometryType === BiometryTypes.none;
  const showBiometryIcon = !IS_ANDROID && isLongPressAvailableForBiometryType && !isHardwareWallet;

  const handleLongPress = useCallback(async () => {
    setIsProcessing(true);

    const provider = getProvider({ chainId });
    let wallet: Wallet | LedgerSigner | null = null;

    try {
      wallet = await loadWallet({ address: accountAddress, provider });
    } catch (e) {
      showWalletErrorAlert();
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error(new RainbowError('[TokenLauncher]: Error Loading Wallet'), {
        message: error.message,
      });
      analyticsV2.track(analyticsV2.event.tokenLauncherWalletLoadFailed, {
        error: error.message,
      });
      setIsProcessing(false);
    }

    if (wallet) {
      setStep(NavigationSteps.CREATING);
      const createTokenResponse = await createToken({ wallet: wallet as Wallet, transactionOptions });
      if (createTokenResponse) {
        addStaleBalance({
          address: accountAddress,
          chainId,
          info: {
            address: createTokenResponse.tokenAddress,
            transactionHash: createTokenResponse.transaction.hash,
          },
        });
        setStep(NavigationSteps.SUCCESS);
      } else {
        setStep(NavigationSteps.REVIEW);
      }
    }

    setIsProcessing(false);

    // TODO: HW wallet signing works but we should incorporate the hw connection modal at some point
    // if (isHardwareWallet) {
    // navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: createToken });
    // } else {}
  }, [createToken, accountAddress, chainId, transactionOptions, setStep, addStaleBalance]);

  return (
    <HoldToActivateButton
      backgroundColor={accentColors.opacity100}
      disabledBackgroundColor={accentColors.opacity12}
      isProcessing={isProcessing}
      showBiometryIcon={showBiometryIcon}
      processingLabel={i18n.t(i18n.l.token_launcher.buttons.creating)}
      label={i18n.t(i18n.l.token_launcher.buttons.hold_to_create)}
      onLongPress={handleLongPress}
      height={48}
      textStyle={{
        color: accentColors.highContrastTextColor,
      }}
      progressColor={accentColors.highContrastTextColor}
      testID="hold-to-create-button"
    />
  );
}

function ContinueButton() {
  const setStep = useTokenLauncherStore(state => state.setStep);
  const canContinueToReview = useTokenLauncherStore(state => state.canContinueToReview());

  const goToReviewStep = useCallback(() => {
    Keyboard.dismiss();
    setStep(NavigationSteps.REVIEW);
  }, [setStep]);

  return (
    <ButtonPressAnimation disabled={!canContinueToReview} onPress={goToReviewStep}>
      <Box
        backgroundColor={colors.white}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="24px"
        borderRadius={28}
        height={48}
        style={{ opacity: canContinueToReview ? 1 : 0.2 }}
      >
        <Text color={{ custom: colors.black }} size="20pt" weight="heavy" style={{ opacity: canContinueToReview ? 1 : 0.5 }}>
          {i18n.t(i18n.l.button.continue)}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}

function ShareButton() {
  const { accentColors } = useTokenLauncherContext();
  const launchedTokenAddress = useTokenLauncherStore(state => state.launchedTokenAddress);
  const chainId = useTokenLauncherStore(state => state.chainId);
  const chainLabels = useBackendNetworksStore(state => state.getChainsLabel());
  const getAnalyticsParams = useTokenLauncherStore(state => state.getAnalyticsParams);

  return (
    <ButtonPressAnimation
      onPress={async () => {
        // This should never happen
        if (!launchedTokenAddress || !chainId) return;

        const url = buildTokenDeeplink({
          networkLabel: chainLabels[chainId],
          contractAddress: launchedTokenAddress,
        });
        await Share.share({
          url,
        });
        analyticsV2.track(analyticsV2.event.tokenLauncherSharePressed, {
          address: launchedTokenAddress,
          url,
          ...getAnalyticsParams(),
        });
      }}
    >
      <Box
        backgroundColor={accentColors.opacity100}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="24px"
        borderRadius={28}
        height={48}
      >
        <Text color={{ custom: accentColors.highContrastTextColor }} size="20pt" weight="heavy">
          {`􀈂 ${i18n.t(i18n.l.token_launcher.buttons.share_link)}`}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}

function TokenPreview() {
  const symbol = useTokenLauncherStore(state => state.symbol);
  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const chainId = useTokenLauncherStore(state => state.chainId);
  const tokenPrice = useTokenLauncherStore(state => state.tokenPrice());
  const tokenMarketCap = useTokenLauncherStore(state => state.tokenMarketCap());
  const symbolLabel = symbol === '' ? i18n.t(i18n.l.token_launcher.placeholders.ticker) : `$${symbol}`;

  return (
    <Animated.View exiting={FadeOut.duration(STEP_TRANSITION_DURATION)} style={{ flex: 1 }}>
      <Inline alignVertical="center" space="12px">
        {imageUri ? (
          <RainbowCoinIcon
            chainId={chainId}
            size={48}
            symbol={symbolLabel}
            icon={imageUri}
            chainSize={20}
            chainBadgePosition={{ x: 48 / 2 + 20 / 2, y: -2 }}
          />
        ) : (
          <Box width={48} height={48} borderRadius={24} background="fillTertiary" justifyContent="center" alignItems="center">
            <Text color="labelTertiary" size="20pt" weight="heavy">
              {'􀣵'}
            </Text>
          </Box>
        )}
        <Box gap={8}>
          <Text style={{ maxWidth: 125 }} numberOfLines={1} color="labelSecondary" size="11pt" weight="bold">
            {symbolLabel}
          </Text>
          <Text numberOfLines={1} color="labelTertiary" size="15pt" weight="bold">
            {tokenPrice}
          </Text>
          <Box flexDirection="row" alignItems="center" gap={4}>
            <Text color="labelQuaternary" size="11pt" weight="bold">
              {i18n.t(i18n.l.token_launcher.titles.mcap)}
            </Text>
            <Text color="labelTertiary" size="11pt" weight="bold">
              {tokenMarketCap}
            </Text>
          </Box>
        </Box>
      </Inline>
    </Animated.View>
  );
}

export function TokenLauncherFooter() {
  const navigation = useNavigation();
  const chainId = useTokenLauncherStore(state => state.chainId);
  const step = useTokenLauncherStore(state => state.step);
  const stepSharedValue = useTokenLauncherStore(state => state.stepSharedValue);
  const stepAnimatedSharedValue = useTokenLauncherStore(state => state.stepAnimatedSharedValue);

  const gasSpeed = useTokenLauncherStore(state => state.gasSpeed);
  const setGasSpeed = useTokenLauncherStore(state => state.setGasSpeed);
  const { transactionOptions } = useTokenLaunchGasOptions({
    chainId,
    gasSpeed,
  });

  const containerWidth = useSharedValue(0);
  const continueButtonWidth = useSharedValue(0);
  // We give this a default width so that the create button doesn't jump past before the gas button is measured
  const gasButtonWidth = useSharedValue(100);

  const createButtonWidth = useDerivedValue(() => {
    return containerWidth.value - gasButtonWidth.value - 32;
  });

  const continueButtonAnimatedStyle = useAnimatedStyle(() => {
    // Don't apply any width until we've measured the button
    if (continueButtonWidth.value === 0) return {};

    const isInputStep = stepSharedValue.value === NavigationSteps.INFO;
    const targetWidth = isInputStep ? continueButtonWidth.value : containerWidth.value - 32;
    return {
      display: stepSharedValue.value === NavigationSteps.INFO ? 'flex' : 'none',
      width: interpolate(
        stepAnimatedSharedValue.value,
        [NavigationSteps.INFO, NavigationSteps.REVIEW],
        [continueButtonWidth.value, targetWidth],
        Extrapolation.CLAMP
      ),
      opacity: interpolate(stepAnimatedSharedValue.value, [NavigationSteps.INFO, NavigationSteps.REVIEW], [1, 0], Extrapolation.CLAMP),
    };
  });

  const createButtonAnimatedStyle = useAnimatedStyle(() => {
    const fullWidth = containerWidth.value - 32;
    // We use this animated value here because otherwise the button will disappear immediately when going back to input step
    const isVisible = stepAnimatedSharedValue.value > NavigationSteps.INFO && stepAnimatedSharedValue.value <= NavigationSteps.CREATING;
    return {
      display: isVisible ? 'flex' : 'none',
      width: interpolate(
        stepAnimatedSharedValue.value,
        [NavigationSteps.INFO, NavigationSteps.REVIEW, NavigationSteps.CREATING],
        [continueButtonWidth.value, createButtonWidth.value, fullWidth],
        Extrapolation.CLAMP
      ),
      opacity: interpolate(stepAnimatedSharedValue.value, [NavigationSteps.INFO, NavigationSteps.REVIEW], [0, 1], Extrapolation.CLAMP),
    };
  });

  const shareButtonAnimatedStyle = useAnimatedStyle(() => {
    const fullWidth = containerWidth.value - 32;
    const isVisible = stepSharedValue.value === NavigationSteps.SUCCESS;
    return {
      opacity: 1,
      width: fullWidth,
      display: isVisible ? 'flex' : 'none',
    };
  });

  const skipButtonAnimatedStyle = useAnimatedStyle(() => {
    const isVisible = stepSharedValue.value === NavigationSteps.SUCCESS;
    return {
      display: isVisible ? 'flex' : 'none',
      height: withTiming(isVisible ? 42 : 0, TIMING_CONFIGS.buttonPressConfig),
    };
  });

  useTokenLauncher();

  return (
    <Animated.View>
      <Box
        paddingHorizontal="16px"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        paddingTop="16px"
        paddingBottom="8px"
        height={FOOTER_HEIGHT}
        onLayout={e => {
          containerWidth.value = e.nativeEvent.layout.width;
        }}
      >
        {step === NavigationSteps.INFO && <TokenPreview />}
        {step === NavigationSteps.REVIEW && (
          <Animated.View
            entering={FadeIn.duration(STEP_TRANSITION_DURATION)}
            onLayout={e => {
              gasButtonWidth.value = e.nativeEvent.layout.width;
            }}
            style={{ flexDirection: 'row' }}
          >
            <GasButton gasSpeed={gasSpeed} chainId={chainId} gasLimit={transactionOptions.gasLimit} onSelectGasSpeed={setGasSpeed} />
            <Box width={1} height={32} paddingHorizontal="12px">
              <Separator thickness={1} direction="vertical" color="separator" />
            </Box>
          </Animated.View>
        )}
        <Animated.View
          style={[continueButtonAnimatedStyle, { position: 'absolute', right: 16 }]}
          onLayout={e => {
            // We only want the original button width
            if (continueButtonWidth.value === 0) {
              continueButtonWidth.value = e.nativeEvent.layout.width;
            }
          }}
        >
          <ContinueButton />
        </Animated.View>

        <Animated.View style={[createButtonAnimatedStyle, { position: 'absolute', right: 16 }]}>
          <HoldToCreateButton />
        </Animated.View>

        <Animated.View style={[shareButtonAnimatedStyle, { position: 'absolute', right: 16 }]}>
          <ShareButton />
        </Animated.View>
      </Box>
      <Animated.View style={[skipButtonAnimatedStyle, { paddingTop: 16 }]}>
        <ButtonPressAnimation
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Text align="center" color="labelTertiary" size="20pt" weight="heavy">
            {i18n.t(i18n.l.button.skip)}
          </Text>
        </ButtonPressAnimation>
      </Animated.View>
    </Animated.View>
  );
}
