import React from 'react';

import { AnimatedText, Box, Inline, Separator, Stack, Text, globalColors, useColorMode } from '@/design-system';
import Animated, { runOnUI, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { NavigationSteps, useSwapContext } from '../providers/swap-provider';
import { fadeConfig } from '../constants';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { ethereumUtils } from '@/utils';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId } from '@/__swaps__/types/chains';
import { chainNameFromChainIdWorklet } from '@/__swaps__/utils/chains';

export function ReviewPanel() {
  const { isDarkMode } = useColorMode();
  const { reviewProgress, SwapNavigation, SwapInputController } = useSwapContext();

  const chainName = useSharedValue(
    SwapInputController.outputChainId.value === ChainId.mainnet
      ? 'ethereum'
      : chainNameFromChainIdWorklet(SwapInputController.outputChainId.value)
  );

  const minimumReceived = useDerivedValue(() => {
    return `0.1231 ETH`;
  });

  const rainbowFee = useDerivedValue(() => {
    return '$2.70';
  });

  const flashbotsProtection = useDerivedValue(() => {
    return 'Off';
  });

  const styles = useAnimatedStyle(() => {
    return {
      opacity: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? withTiming(1, fadeConfig) : withTiming(0, fadeConfig),
      flex: 1,
    };
  });

  return (
    // @ts-ignore
    <PanGestureHandler
      onGestureEvent={() => runOnUI(SwapNavigation.handleDismissReview)()}
      enabled={reviewProgress.value === NavigationSteps.SHOW_REVIEW}
    >
      <Box as={Animated.View} zIndex={11} style={styles} testID="review-screen" width="full">
        {/* header */}
        <Stack alignHorizontal="center" space="28px">
          <Text weight="heavy" color={{ custom: globalColors.white100 }} size="20pt">
            Review
          </Text>

          <Stack width="full" space="24px" alignHorizontal="stretch">
            <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
              <Inline horizontalSpace="12px">
                <Text color="labelTertiary" weight="bold" size="13pt">
                  􀤆
                </Text>
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  Network
                </Text>
              </Inline>

              <Inline alignVertical="center" horizontalSpace="6px">
                <ChainImage
                  chain={ethereumUtils.getNetworkFromChainId(SwapInputController.outputChainId.value ?? ChainId.mainnet)}
                  size={16}
                />
                <AnimatedText
                  align="right"
                  color={isDarkMode ? 'labelSecondary' : 'label'}
                  size="15pt"
                  weight="heavy"
                  style={{ textTransform: 'capitalize' }}
                  text={chainName}
                />
              </Inline>
            </Inline>

            <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
              <Inline horizontalSpace="12px">
                <Text color="labelTertiary" weight="bold" size="13pt">
                  􀄩
                </Text>
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  Minimum Received
                </Text>
              </Inline>

              <Inline horizontalSpace="6px">
                <AnimatedText
                  align="right"
                  color={isDarkMode ? 'labelSecondary' : 'label'}
                  size="15pt"
                  weight="heavy"
                  text={minimumReceived}
                />
              </Inline>
            </Inline>

            <Inline horizontalSpace="10px" alignHorizontal="justify">
              <Inline horizontalSpace="12px">
                <Text color="labelTertiary" weight="bold" size="13pt">
                  􀘾
                </Text>
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  Rainbow Fee
                </Text>
              </Inline>

              <Inline horizontalSpace="6px">
                <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy" text={rainbowFee} />
              </Inline>
            </Inline>

            <Separator color="separatorSecondary" />

            <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
              <Inline horizontalSpace="12px">
                <Text color="labelTertiary" weight="bold" size="13pt">
                  􀋦
                </Text>
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  Flashbots Protection
                </Text>
              </Inline>

              <Inline alignVertical="center" horizontalSpace="6px">
                <AnimatedText
                  align="right"
                  color={isDarkMode ? 'labelSecondary' : 'label'}
                  size="15pt"
                  weight="heavy"
                  text={flashbotsProtection}
                />
                <AnimatedText
                  align="right"
                  color={isDarkMode ? 'labelSecondary' : 'label'}
                  size="15pt"
                  weight="heavy"
                  style={{ textTransform: 'capitalize' }}
                  text={chainName}
                />
              </Inline>
            </Inline>

            <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
              <Inline horizontalSpace="12px">
                <Text color="labelTertiary" weight="bold" size="13pt">
                  􀘩
                </Text>
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  Max Slippage
                </Text>
              </Inline>
            </Inline>

            <Separator color="separatorSecondary" />
          </Stack>
        </Stack>
        {/* settings */}

        {/* gas */}

        {/* hold to send button */}
      </Box>
    </PanGestureHandler>
  );
}
