import React, { useCallback, useState } from 'react';
import { Box, Inline, Separator, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
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
import { Keyboard } from 'react-native';
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
export const FOOTER_HEIGHT = 56 + 16 + 8;

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

  const [isProcessing, setIsProcessing] = useState(false);
  const isLongPressAvailableForBiometryType =
    biometryType === BiometryTypes.FaceID || biometryType === BiometryTypes.Face || biometryType === BiometryTypes.none;
  const showBiometryIcon = !IS_ANDROID && isLongPressAvailableForBiometryType && !isHardwareWallet;

  const handleLongPress = useCallback(async () => {
    // TESTING
    setStep('creating');
    setIsProcessing(true);
    const provider = getProvider({ chainId });
    const wallet = await loadWallet({
      address: accountAddress,
      provider,
    });

    if (isHardwareWallet) {
      // navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: createToken });
    } else {
      if (wallet) {
        await createToken({ wallet: wallet as Wallet, transactionOptions });
      }
    }
    setStep('success');
    setIsProcessing(false);
  }, [isHardwareWallet, createToken, accountAddress, chainId, transactionOptions]);

  return (
    <HoldToActivateButton
      backgroundColor={accentColors.opacity100}
      disabledBackgroundColor={accentColors.opacity12}
      isProcessing={isProcessing}
      showBiometryIcon={showBiometryIcon}
      processingLabel={'Creating...'}
      label={'Hold to Create'}
      onLongPress={handleLongPress}
      height={48}
      testID="hold-to-create-button"
    />
  );
}

function ContinueButton() {
  const setStep = useTokenLauncherStore(state => state.setStep);
  const canContinueToReview = useTokenLauncherStore(state => state.canContinueToReview());

  const goToReviewStep = useCallback(() => {
    Keyboard.dismiss();
    setStep('review');
  }, [setStep]);

  // TODO: remove testing
  return (
    <ButtonPressAnimation disabled={!canContinueToReview && false} onPress={goToReviewStep}>
      <Box
        background={canContinueToReview ? 'blue' : 'fillTertiary'}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="24px"
        borderRadius={28}
        height={48}
      >
        <Text color={canContinueToReview ? 'label' : 'labelTertiary'} size="20pt" weight="heavy">
          {'Continue'}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}

function ShareButton() {
  const { accentColors } = useTokenLauncherContext();
  return (
    <ButtonPressAnimation onPress={() => {}}>
      <Box
        backgroundColor={accentColors.opacity100}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="24px"
        borderRadius={28}
        height={48}
      >
        <Text color="label" size="20pt" weight="heavy">
          {'􀈂 Share Link'}
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
  const symbolLabel = symbol === '' ? 'NAME' : symbol;

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
        <Box gap={10}>
          <Inline alignVertical="center" space="8px">
            <Text color="label" size="15pt" weight="bold">
              {`$${symbolLabel}`}
            </Text>
            <Box height={4} width={4} background="fillTertiary" borderRadius={2} />
            <Text color="label" size="15pt" weight="bold">
              {tokenPrice}
            </Text>
          </Inline>
          <Inline wrap={false} alignVertical="center" space="4px">
            <Text color="labelQuaternary" size="13pt" weight="bold">
              {'MCAP'}
            </Text>
            <Text color="labelTertiary" size="13pt" weight="bold">
              {tokenMarketCap}
            </Text>
          </Inline>
        </Box>
      </Inline>
    </Animated.View>
  );
}

export function TokenLauncherFooter() {
  const navigation = useNavigation();
  const resetStore = useTokenLauncherStore(state => state.reset);
  const chainId = useTokenLauncherStore(state => state.chainId);
  const step = useTokenLauncherStore(state => state.step);
  const stepSharedValue = useTokenLauncherStore(state => state.stepSharedValue);
  const stepIndex = useTokenLauncherStore(state => state.stepIndex);

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

    const isInputStep = stepIndex.value === 0;
    const targetWidth = isInputStep ? continueButtonWidth.value : containerWidth.value - 32;

    return {
      display: stepSharedValue.value === 'info' ? 'flex' : 'none',
      width: interpolate(stepIndex.value, [0, 1], [continueButtonWidth.value, targetWidth], Extrapolation.CLAMP),
      opacity: interpolate(stepIndex.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    };
  });

  const createButtonAnimatedStyle = useAnimatedStyle(() => {
    const fullWidth = containerWidth.value - 32;
    const isVisible = stepSharedValue.value === 'review' || stepSharedValue.value === 'creating';
    return {
      display: isVisible ? 'flex' : 'none',
      width: interpolate(stepIndex.value, [0, 1, 2], [continueButtonWidth.value, createButtonWidth.value, fullWidth], Extrapolation.CLAMP),
      opacity: interpolate(stepIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    };
  });

  const shareButtonAnimatedStyle = useAnimatedStyle(() => {
    const fullWidth = containerWidth.value - 32;
    const isVisible = stepSharedValue.value === 'success';

    return {
      opacity: 1,
      width: fullWidth,
      display: isVisible ? 'flex' : 'none',
    };
  });

  const skipButtonAnimatedStyle = useAnimatedStyle(() => {
    const isVisible = stepSharedValue.value === 'success';
    return {
      display: isVisible ? 'flex' : 'none',
      height: withTiming(isVisible ? 42 : 0, TIMING_CONFIGS.buttonPressConfig),
    };
  });

  return (
    <Animated.View>
      <Box
        paddingHorizontal="16px"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        height={FOOTER_HEIGHT}
        onLayout={e => {
          containerWidth.value = e.nativeEvent.layout.width;
        }}
      >
        {step === 'info' && <TokenPreview />}
        {step === 'review' && (
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
            resetStore();
            navigation.goBack();
          }}
        >
          <Text align="center" color="labelTertiary" size="20pt" weight="heavy">
            {'Skip'}
          </Text>
        </ButtonPressAnimation>
      </Animated.View>
    </Animated.View>
  );
}
