import React, { useCallback, useMemo } from 'react';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import * as i18n from '@/languages';

import { AnimatedText, Box, Inline, Separator, Stack, Text, globalColors, useColorMode } from '@/design-system';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { fadeConfig } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { CUSTOM_GAS_FIELDS } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { useGas } from '@/hooks';
import { getTrendKey } from '@/helpers/gas';
import { gasUtils } from '@/utils';
import { toFixedDecimals } from '@/helpers/utilities';
import { useNavigation } from '@/navigation';
import { Keyboard } from 'react-native';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { upperFirst } from 'lodash';
import { IS_ANDROID } from '@/env';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';

const { CUSTOM, GAS_TRENDS, NORMAL, URGENT, FLASHBOTS_MIN_TIP } = gasUtils;

const MINER_TIP_TYPE = 'minerTip';
const MAX_BASE_FEE_TYPE = 'maxBaseFee';
const HIGH_ALERT = 'HIGH_ALERT';
const LOW_ALERT = 'LOW_ALERT';

type AlertInfo = {
  type: typeof LOW_ALERT | typeof HIGH_ALERT;
  message: string;
} | null;

export function GasPanel() {
  const { selectedGasFee, currentBlockParams, customGasFeeModifiedByUser, gasFeeParamsBySpeed, updateToCustomGasFee, txNetwork } = useGas();

  const { isDarkMode } = useColorMode();
  const { configProgress, SwapCustomGas } = useSwapContext();
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const currentBaseFee = useDerivedValue(() => `${SwapCustomGas.currentBaseFee.value} gwei`);
  const maxTransactionFee = useDerivedValue(() => {
    return '$3.33';
  });

  const styles = useAnimatedStyle(() => {
    return {
      display: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'flex',
      pointerEvents: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'auto',
      opacity: configProgress.value === NavigationSteps.SHOW_GAS ? withTiming(1, fadeConfig) : withTiming(0, fadeConfig),
      flex: 1,
    };
  });

  const currentGasTrend = useMemo(() => getTrendKey(currentBlockParams?.trend), [currentBlockParams?.trend]);
  const trendType = 'currentBaseFee' + upperFirst(currentGasTrend);
  const selectedOptionIsCustom = useMemo(() => selectedGasFee?.option === CUSTOM, [selectedGasFee?.option]);

  console.log(currentGasTrend);

  // TODO: L2 check for the currentBaseFee
  const openGasHelper = useCallback(
    (type: string) => {
      Keyboard.dismiss();
      navigate(Routes.EXPLAIN_SHEET, {
        currentBaseFee: toFixedDecimals(currentBaseFee.value, 0),
        currentGasTrend,
        type,
      });
    },
    [currentBaseFee, currentGasTrend, navigate]
  );

  const renderRowLabel = (label: string, type: string, error?: AlertInfo, warning?: AlertInfo) => {
    let color: TextColor | CustomColor = 'labelTertiary';
    let text;
    if ((!error && !warning) || !selectedOptionIsCustom) {
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
        onPress={() => openGasHelper(type)}
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
            {renderRowLabel(i18n.t(i18n.l.gas.current_base_fee), trendType)}

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
            {/* TODO: Add error and warning values here */}
            {renderRowLabel(i18n.t(i18n.l.gas.max_base_fee), MAX_BASE_FEE_TYPE, null, null)}

            <Inline wrap={false} alignVertical="center" horizontalSpace="6px">
              <Inline wrap={false} horizontalSpace="8px" alignVertical="center">
                <ButtonPressAnimation onPress={() => SwapCustomGas.onUpdateField(CUSTOM_GAS_FIELDS.MAX_BASE_FEE, 'decrement', 3)}>
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

                <AnimatedText size="15pt" weight="bold" color="labelSecondary" text={SwapCustomGas.maxBaseFee} />

                <ButtonPressAnimation onPress={() => SwapCustomGas.onUpdateField(CUSTOM_GAS_FIELDS.MAX_BASE_FEE, 'increment', 3)}>
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
            {/* TODO: Add error and warning values here */}
            {renderRowLabel(i18n.t(i18n.l.gas.miner_tip), MINER_TIP_TYPE, null, null)}

            <Inline wrap={false} alignVertical="center" horizontalSpace="6px">
              <Inline wrap={false} horizontalSpace="8px" alignVertical="center">
                <ButtonPressAnimation onPress={() => SwapCustomGas.onUpdateField(CUSTOM_GAS_FIELDS.MINER_TIP, 'decrement')}>
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

                <AnimatedText size="15pt" weight="bold" color="labelSecondary" text={SwapCustomGas.minerTip} />

                <ButtonPressAnimation onPress={() => SwapCustomGas.onUpdateField(CUSTOM_GAS_FIELDS.MINER_TIP, 'increment')}>
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
