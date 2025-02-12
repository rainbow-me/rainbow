import React, { useCallback } from 'react';
import { Box, Inline, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import Animated, {
  Extrapolate,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { STEP_TRANSITION_DURATION } from '../constants';
import { Keyboard } from 'react-native';
import { HoldToAuthorizeButton } from '@/components/buttons';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';

export const TOKEN_PREVIEW_BAR_HEIGHT = 56 + 16 + 8;

export function TokenPreviewBar() {
  const { accentColors } = useTokenLauncherContext();

  const symbol = useTokenLauncherStore(state => state.symbol);
  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const chainId = useTokenLauncherStore(state => state.chainId);
  const tokenPrice = useTokenLauncherStore(state => state.tokenPrice());
  const tokenMarketCap = useTokenLauncherStore(state => state.tokenMarketCap());
  const setStep = useTokenLauncherStore(state => state.setStep);
  const step = useTokenLauncherStore(state => state.step);
  const stepIndex = useTokenLauncherStore(state => state.stepIndex);
  const hasCompletedRequiredFields = useTokenLauncherStore(state => state.hasCompletedRequiredFields());

  const containerWidth = useSharedValue(0);
  const buttonWidth = useSharedValue(0);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    // Don't apply any width until we've measured the button
    if (buttonWidth.value === 0) return {};

    const isInputStep = stepIndex.value === 0;
    const targetWidth = isInputStep ? buttonWidth.value : containerWidth.value - 32;

    return {
      width: interpolate(stepIndex.value, [0, 1], [buttonWidth.value, targetWidth], Extrapolate.CLAMP),
    };
  });

  const symbolLabel = symbol === '' ? '$NAME' : symbol;
  const goToOverviewStep = useCallback(() => {
    Keyboard.dismiss();
    setStep('overview');
  }, [setStep]);

  return (
    <Box
      paddingHorizontal="16px"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      height={TOKEN_PREVIEW_BAR_HEIGHT}
      onLayout={e => {
        containerWidth.value = e.nativeEvent.layout.width;
      }}
    >
      {step === 'info' && (
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
                  {symbolLabel}
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
      )}
      {/* {step === 'overview' && (
        <HoldToAuthorizeButton
          disabled={false}
          backgroundColor={accentColors.opacity100}
          hideInnerBorder
          label={'Hold to Create'}
          onLongPress={() => {
            console.log('onLongPress');
          }}
          parentHorizontalPadding={16}
          showBiometryIcon={true}
        />
      )} */}
      <Animated.View
        style={[buttonAnimatedStyle, { position: 'absolute', right: 16 }]}
        onLayout={e => {
          // We only want the original button width
          if (buttonWidth.value === 0) {
            buttonWidth.value = e.nativeEvent.layout.width;
          }
        }}
      >
        <ButtonPressAnimation disabled={false} onPress={goToOverviewStep}>
          <Box
            background={hasCompletedRequiredFields ? 'blue' : 'fillTertiary'}
            justifyContent="center"
            alignItems="center"
            paddingHorizontal="24px"
            borderRadius={28}
            height={56}
          >
            <Text color="label" size="20pt" weight="heavy">
              Continue
            </Text>
          </Box>
        </ButtonPressAnimation>
      </Animated.View>
    </Box>
  );
}
