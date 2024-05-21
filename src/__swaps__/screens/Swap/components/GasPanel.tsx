import React from 'react';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import * as i18n from '@/languages';

import { AnimatedText, Box, Inline, Separator, Stack, Text, globalColors, useColorMode } from '@/design-system';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { fadeConfig } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { useTheme } from '@/theme';
import { IS_ANDROID } from '@/env';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';

const MINER_TIP_TYPE = 'minerTip';
const MAX_BASE_FEE_TYPE = 'maxBaseFee';
const HIGH_ALERT = 'HIGH_ALERT';
const LOW_ALERT = 'LOW_ALERT';

type AlertInfo = {
  type: typeof LOW_ALERT | typeof HIGH_ALERT;
  message: string;
} | null;

const unknown = i18n.t(i18n.l.swap.unknown);

export function GasPanel() {
  const { SwapGas } = useSwapContext();

  const maxTransactionFee = useDerivedValue(() => {
    if (!SwapGas.gasFeeParamsBySpeed.value?.custom) {
      return unknown;
    }

    const customGas = SwapGas.gasFeeParamsBySpeed.value?.custom;

    return customGas.gasFee.display;
  });

  const { isDarkMode } = useColorMode();
  const { configProgress } = useSwapContext();
  const { colors } = useTheme();

  const styles = useAnimatedStyle(() => {
    return {
      display: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'flex',
      pointerEvents: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'auto',
      opacity: configProgress.value === NavigationSteps.SHOW_GAS ? withTiming(1, fadeConfig) : withTiming(0, fadeConfig),
      flex: 1,
    };
  });

  const renderRowLabel = (label: string, type: string, error?: AlertInfo, warning?: AlertInfo) => {
    let color: TextColor | CustomColor = 'labelTertiary';
    let text;
    if (!error && !warning) {
      color = 'labelTertiary';
      text = '􀅵';
    } else if (error) {
      color = {
        custom: colors.red,
      };
      text = '􀇿';
    } else {
      color = {
        custom: colors.yellowFavorite,
      };
      text = '􀇿';
    }

    return (
      <Box
        as={ButtonPressAnimation}
        paddingVertical="8px"
        marginVertical="-8px"
        onPress={() => {}} // TODO: Open gas helper for trend type
        backgroundColor="accent"
        style={{ maxWidth: 175 }}
      >
        <Inline horizontalSpace="4px" alignVertical="center">
          <Text color="labelTertiary" size="15pt" weight="semibold" numberOfLines={2}>
            {`${label} `}
            <Text size="13pt" color={color} weight="bold" numberOfLines={1}>
              {text}
            </Text>
          </Text>
          <Box marginBottom={IS_ANDROID ? '-4px' : undefined}></Box>
        </Inline>
      </Box>
    );
  };

  return (
    <Box as={Animated.View} zIndex={12} style={styles} testID="review-panel" width="full">
      <Stack alignHorizontal="center" space="28px">
        <Text weight="heavy" color="label" size="20pt">
          {i18n.t(i18n.l.gas.gas_settings)}
        </Text>

        <Stack width="full" space="24px" alignHorizontal="stretch">
          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            {renderRowLabel(i18n.t(i18n.l.gas.current_base_fee), '')}

            <Inline space="2px">
              <AnimatedText
                align="right"
                color={isDarkMode ? 'labelSecondary' : 'label'}
                size="15pt"
                weight="heavy"
                style={{ textTransform: 'capitalize' }}
              >
                {SwapGas.currentBaseFee}
              </AnimatedText>
              <Text
                align="right"
                color={isDarkMode ? 'labelSecondary' : 'label'}
                size="15pt"
                weight="heavy"
                style={{ textTransform: 'capitalize' }}
              >
                Gwei
              </Text>
            </Inline>
          </Inline>

          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            {/* TODO: Add error and warning values here */}
            {renderRowLabel(i18n.t(i18n.l.gas.max_base_fee), MAX_BASE_FEE_TYPE, null, null)}

            <Inline wrap={false} alignVertical="center" horizontalSpace="6px">
              <Inline wrap={false} horizontalSpace="8px" alignVertical="center">
                {/* TODO: Handle decrement by 3 */}
                <ButtonPressAnimation onPress={() => {}}>
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

                <AnimatedText size="15pt" weight="bold" color="labelSecondary" text={SwapGas.maxBaseFee} />

                {/* TODO: Handle increment by 3 */}
                <ButtonPressAnimation onPress={() => {}}>
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
                Gwei
              </Text>
            </Inline>
          </Inline>

          <Inline horizontalSpace="10px" alignHorizontal="justify">
            {/* TODO: Add error and warning values here */}
            {renderRowLabel(i18n.t(i18n.l.gas.miner_tip), MINER_TIP_TYPE, null, null)}

            <Inline wrap={false} alignVertical="center" horizontalSpace="6px">
              <Inline wrap={false} horizontalSpace="8px" alignVertical="center">
                {/* TODO: Handle decrement by 1 */}
                <ButtonPressAnimation onPress={() => {}}>
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

                <AnimatedText size="15pt" weight="bold" color="labelSecondary" text={SwapGas.maxPriorityFee} />

                {/* TODO: Handle increment by 1 */}
                <ButtonPressAnimation onPress={() => {}}>
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
                Gwei
              </Text>
            </Inline>
          </Inline>

          <Separator color="separatorSecondary" />

          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline horizontalSpace="12px">
              <Inline horizontalSpace="4px">
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  {i18n.t(i18n.l.gas.max_transaction_fee)}
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
