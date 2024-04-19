import React, { useCallback } from 'react';

import { AnimatedText, Box, Inline, Separator, Stack, Text, globalColors, useColorMode } from '@/design-system';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { NavigationSteps, useSwapContext } from '../../providers/swap-provider';
import { fadeConfig } from '../../constants';
import { ButtonPressAnimation } from '@/components/animations';

const SLIPPAGE_STEP = 0.5;

export function GasPanel() {
  const { isDarkMode } = useColorMode();
  const { configProgress, SwapInputController } = useSwapContext();

  const baseFee = useSharedValue(`15`);
  const currentBaseFee = useDerivedValue(() => `${baseFee.value} gwei`);
  const maxBaseFee = useSharedValue(`23`);
  const minerTip = useSharedValue(`1`);
  const maxTransactionFee = useDerivedValue(() => {
    return '$3.33';
  });

  const onSetSlippage = useCallback(
    (operation: 'increment' | 'decrement') => {
      'worklet';
      const value = operation === 'increment' ? SLIPPAGE_STEP : -SLIPPAGE_STEP;
      SwapInputController.slippage.value = `${Math.max(0.5, Number(SwapInputController.slippage.value) + value)}`;
    },
    [SwapInputController.slippage]
  );

  const styles = useAnimatedStyle(() => {
    return {
      display: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'flex',
      pointerEvents: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'auto',
      opacity: configProgress.value === NavigationSteps.SHOW_GAS ? withTiming(1, fadeConfig) : withTiming(0, fadeConfig),
      flex: 1,
    };
  });

  return (
    <Box as={Animated.View} zIndex={12} style={styles} testID="review-panel" width="full">
      <Stack alignHorizontal="center" space="28px">
        <Text weight="heavy" color="label" size="20pt">
          Gas Settings
        </Text>

        <Stack width="full" space="24px" alignHorizontal="stretch">
          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline alignVertical="center" horizontalSpace="4px">
              <Text color="labelTertiary" weight="semibold" size="15pt">
                Current Base Fee
              </Text>
              <Text color="labelTertiary" size="13pt" weight="bold">
                􀅴
              </Text>
            </Inline>

            <AnimatedText
              align="right"
              color={isDarkMode ? 'labelSecondary' : 'label'}
              size="15pt"
              weight="heavy"
              style={{ textTransform: 'capitalize' }}
              text={currentBaseFee}
            />
          </Inline>

          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline alignVertical="center" horizontalSpace="4px">
              <Text color="labelTertiary" weight="semibold" size="15pt">
                Max Base Fee
              </Text>
              <Text color="labelTertiary" size="13pt" weight="bold">
                􀅴
              </Text>
            </Inline>

            <Inline wrap={false} alignVertical="center" horizontalSpace="6px">
              <Inline wrap={false} horizontalSpace="8px" alignVertical="center">
                <ButtonPressAnimation onPress={() => onSetSlippage('decrement')}>
                  <Box
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDarkMode ? globalColors.white10 : globalColors.grey100,
                    }}
                    height={{ custom: 16 }}
                    width={{ custom: 20 }}
                    borderRadius={100}
                    background="fillSecondary" // TODO: 12% opacity
                    paddingVertical="1px (Deprecated)"
                    gap={10}
                  >
                    {/* TODO: 56% opacity */}
                    <Text weight="black" size="icon 10px" color="labelTertiary">
                      􀅽
                    </Text>
                  </Box>
                </ButtonPressAnimation>

                <AnimatedText size="15pt" weight="bold" color="labelSecondary" text={maxBaseFee} />

                <ButtonPressAnimation onPress={() => onSetSlippage('increment')}>
                  <Box
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDarkMode ? globalColors.white10 : globalColors.grey100,
                    }}
                    height={{ custom: 16 }}
                    width={{ custom: 20 }}
                    borderRadius={100}
                    background="fillSecondary" // TODO: 12% opacity
                    paddingVertical="1px (Deprecated)"
                    gap={10}
                  >
                    {/* TODO: 56% opacity */}
                    <Text weight="black" size="icon 10px" color="labelTertiary">
                      􀅼
                    </Text>
                  </Box>
                </ButtonPressAnimation>
              </Inline>
              <Text align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
                gwei
              </Text>
            </Inline>
          </Inline>

          <Inline horizontalSpace="10px" alignHorizontal="justify">
            <Inline alignVertical="center" horizontalSpace="4px">
              <Text color="labelTertiary" weight="semibold" size="15pt">
                Miner Tip
              </Text>
              <Text color="labelTertiary" size="13pt" weight="bold">
                􀅴
              </Text>
            </Inline>

            <Inline wrap={false} alignVertical="center" horizontalSpace="6px">
              <Inline wrap={false} horizontalSpace="8px" alignVertical="center">
                <ButtonPressAnimation onPress={() => onSetSlippage('decrement')}>
                  <Box
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDarkMode ? globalColors.white10 : globalColors.grey100,
                    }}
                    height={{ custom: 16 }}
                    width={{ custom: 20 }}
                    borderRadius={100}
                    background="fillSecondary" // TODO: 12% opacity
                    paddingVertical="1px (Deprecated)"
                    gap={10}
                  >
                    {/* TODO: 56% opacity */}
                    <Text weight="black" size="icon 10px" color="labelTertiary">
                      􀅽
                    </Text>
                  </Box>
                </ButtonPressAnimation>

                <AnimatedText size="15pt" weight="bold" color="labelSecondary" text={maxBaseFee} />

                <ButtonPressAnimation onPress={() => onSetSlippage('increment')}>
                  <Box
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDarkMode ? globalColors.white10 : globalColors.grey100,
                    }}
                    height={{ custom: 16 }}
                    width={{ custom: 20 }}
                    borderRadius={100}
                    background="fillSecondary" // TODO: 12% opacity
                    paddingVertical="1px (Deprecated)"
                    gap={10}
                  >
                    {/* TODO: 56% opacity */}
                    <Text weight="black" size="icon 10px" color="labelTertiary">
                      􀅼
                    </Text>
                  </Box>
                </ButtonPressAnimation>
              </Inline>
              <Text align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
                gwei
              </Text>
            </Inline>
          </Inline>

          <Separator color="separatorSecondary" />

          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline horizontalSpace="12px">
              <Inline horizontalSpace="4px">
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  Max Transaction Fee
                </Text>
                <Text color="labelTertiary" size="13pt" weight="bold">
                  􀅴
                </Text>
              </Inline>
            </Inline>

            <Inline horizontalSpace="6px">
              <AnimatedText
                align="right"
                color={isDarkMode ? 'labelSecondary' : 'label'}
                size="15pt"
                weight="heavy"
                text={maxTransactionFee}
              />
            </Inline>
          </Inline>
        </Stack>
      </Stack>
    </Box>
  );
}
