import * as i18n from '@/languages';
import React, { PropsWithChildren } from 'react';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { fadeConfig } from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ChainId } from '@/__swaps__/types/chains';
import { gweiToWei, weiToGwei } from '@/__swaps__/utils/ethereum';
import { useBaseFee, useGasTrend, useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import { add, subtract } from '@/__swaps__/utils/numbers';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Inline, Separator, Stack, Text, globalColors, useColorMode } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { lessThan } from '@/helpers/utilities';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { upperFirst } from 'lodash';
import { formatNumber } from '../hooks/formatNumber';
import { GasSettings, setCustomGasSettings } from '../hooks/useCustomGas';
import { useSwapEstimatedGasFee } from '../hooks/useEstimatedGasFee';
import { setSelectedGasSpeed, useSelectedGasSpeed } from '../hooks/useSelectedGas';

const MINER_TIP_TYPE = 'minerTip';
const MAX_BASE_FEE_TYPE = 'maxBaseFee';
const HIGH_ALERT = 'HIGH_ALERT';
const LOW_ALERT = 'LOW_ALERT';

type AlertInfo = {
  type: typeof LOW_ALERT | typeof HIGH_ALERT;
  message: string;
} | null;

function PressableLabel({ onPress, children }: PropsWithChildren<{ onPress: VoidFunction }>) {
  return (
    <Box
      as={ButtonPressAnimation}
      paddingVertical="8px"
      marginVertical="-8px"
      onPress={onPress}
      backgroundColor="accent"
      style={{ maxWidth: 175 }}
    >
      <Inline horizontalSpace="4px" alignVertical="center">
        <Text color="labelTertiary" size="15pt" weight="semibold" numberOfLines={2}>
          {`${children} `}
          <Text size="13pt" color={'labelTertiary'} weight="bold" numberOfLines={1}>
            􀅴
          </Text>
        </Text>
        <Box marginBottom={IS_ANDROID ? '-4px' : undefined}></Box>
      </Inline>
    </Box>
  );
}

function NumericInputButton({ children, onPress }: PropsWithChildren<{ onPress: VoidFunction }>) {
  const { isDarkMode } = useColorMode();

  return (
    <ButtonPressAnimation onPress={onPress}>
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
          {children}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}

const INPUT_STEP = gweiToWei('0.1');
function GasSettingInput({
  onDebouncedChange: onChange,
  min = '0',
  value = min || '0',
}: {
  onDebouncedChange: (v: string) => void;
  value: string | undefined;
  min?: string;
}) {
  const { isDarkMode } = useColorMode();

  return (
    <Inline wrap={false} alignVertical="center" horizontalSpace="6px">
      <Inline wrap={false} horizontalSpace="8px" alignVertical="center">
        <NumericInputButton
          onPress={() => {
            const newValue = subtract(value, INPUT_STEP);
            onChange(lessThan(newValue, min) ? min : newValue);
          }}
        >
          􀅽
        </NumericInputButton>

        <Text size="15pt" weight="bold" color="labelSecondary">
          {formatNumber(weiToGwei(value))}
        </Text>

        <NumericInputButton onPress={() => onChange(add(value, INPUT_STEP))}>􀅼</NumericInputButton>
      </Inline>

      <Text align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
        Gwei
      </Text>
    </Inline>
  );
}

const selectWeiToGwei = (s: string | undefined) => s && weiToGwei(s);

function CurrentBaseFee() {
  const { isDarkMode } = useColorMode();
  const { navigate } = useNavigation();

  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const { data: baseFee } = useBaseFee({ chainId, select: selectWeiToGwei });
  const { data: gasTrend } = useGasTrend({ chainId });

  const trendType = 'currentBaseFee' + upperFirst(gasTrend);

  // loading state?

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      <PressableLabel
        onPress={() =>
          navigate(Routes.EXPLAIN_SHEET, {
            currentBaseFee: baseFee,
            currentGasTrend: gasTrend,
            type: trendType,
          })
        }
      >
        {i18n.t(i18n.l.gas.current_base_fee)}
      </PressableLabel>
      <Text
        align="right"
        color={isDarkMode ? 'labelSecondary' : 'label'}
        size="15pt"
        weight="heavy"
        style={{ textTransform: 'capitalize' }}
      >
        {formatNumber(baseFee || '0')}
      </Text>
    </Inline>
  );
}

type GasPanelState = { gasPrice?: string; maxBaseFee?: string; maxPriorityFee?: string };
const useGasPanelStore = createRainbowStore<GasPanelState | undefined>(() => undefined);

function useGasPanelState<Selected>(selector: (s: GasPanelState | undefined) => Selected = s => s as Selected) {
  const state = useGasPanelStore(selector);

  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const selectedSpeed = useSelectedGasSpeed(chainId);
  const { data: placeholder } = useMeteorologySuggestions({
    chainId,
    select: d => selector(selectedSpeed === 'custom' ? undefined : d[selectedSpeed]),
    enabled: !state && selectedSpeed !== 'custom',
  });

  return state ?? placeholder;
}

const setGasPanelState = (update: Partial<GasPanelState>) => useGasPanelStore.setState(update);

function EditMaxBaseFee() {
  const maxBaseFee = useGasPanelState(s => s?.maxBaseFee);
  const { navigate } = useNavigation();

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      {/* TODO: Add error and warning values here */}
      <PressableLabel onPress={() => navigate(Routes.EXPLAIN_SHEET, { type: MAX_BASE_FEE_TYPE })}>
        {i18n.t(i18n.l.gas.max_base_fee)}
      </PressableLabel>
      <GasSettingInput value={maxBaseFee} onDebouncedChange={maxBaseFee => setGasPanelState({ maxBaseFee })} />
    </Inline>
  );
}

const MIN_FLASHBOTS_PRIORITY_FEE = gweiToWei('6');
function EditPriorityFee() {
  const maxPriorityFee = useGasPanelState(s => s?.maxPriorityFee);
  const { navigate } = useNavigation();

  const isFlashbotsEnabled = useSwapsStore(s => s.flashbots);
  // TODO: THIS FLASHBOTS INPUT LOGIC IS FLAWED REVIEW LATER
  const min = isFlashbotsEnabled ? MIN_FLASHBOTS_PRIORITY_FEE : '0';

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      {/* TODO: Add error and warning values here */}
      <PressableLabel onPress={() => navigate(Routes.EXPLAIN_SHEET, { type: MINER_TIP_TYPE })}>
        {i18n.t(i18n.l.gas.miner_tip)}
      </PressableLabel>
      <GasSettingInput value={maxPriorityFee} onDebouncedChange={maxPriorityFee => setGasPanelState({ maxPriorityFee })} min={min} />
    </Inline>
  );
}

function EditGasPrice() {
  const gasPrice = useGasPanelState(s => s?.gasPrice);
  const { navigate } = useNavigation();

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      {/* TODO: Add error and warning values here */}
      <PressableLabel onPress={() => navigate(Routes.EXPLAIN_SHEET, { type: MAX_BASE_FEE_TYPE })}>
        {i18n.t(i18n.l.gas.max_base_fee)}
      </PressableLabel>
      <GasSettingInput value={gasPrice} onDebouncedChange={gasPrice => setGasPanelState({ gasPrice })} />
    </Inline>
  );
}

const stateToGasSettings = (s: GasPanelState | undefined): GasSettings | undefined => {
  if (!s) return;
  if (s.gasPrice) return { isEIP1559: false, gasPrice: s.gasPrice || '0' };
  return { isEIP1559: true, maxBaseFee: s.maxBaseFee || '0', maxPriorityFee: s.maxPriorityFee || '0' };
};
function MaxTransactionFee() {
  const { isDarkMode } = useColorMode();

  const gasSettings = useGasPanelStore(stateToGasSettings);
  const maxTransactionFee = useSwapEstimatedGasFee(gasSettings);

  return (
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
        <Text align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
          {maxTransactionFee}
        </Text>
      </Inline>
    </Inline>
  );
}

function EditableGasSettings() {
  // const isEIP1559 = use;
  // if (!isEIP1559) return <EditGasPrice />;
  return (
    <>
      <EditMaxBaseFee />
      <EditPriorityFee />
    </>
  );
}

function saveCustomGasSettings() {
  const unsaved = useGasPanelStore.getState();
  // input is debounced if the time between editing and closing the panel is less than the debounce time (500ms) it's gonna be outdated
  if (!unsaved) return;

  const { inputAsset } = useSwapsStore.getState();
  const chainId = inputAsset?.chainId || ChainId.mainnet;
  setCustomGasSettings(chainId, unsaved);
  setSelectedGasSpeed(chainId, 'custom');
  useGasPanelStore.setState(undefined);
}

export function onCloseGasPanel() {
  saveCustomGasSettings();
}

export function GasPanel() {
  const { configProgress } = useSwapContext();

  const styles = useAnimatedStyle(() => {
    return {
      display: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'flex',
      pointerEvents: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'auto',
      opacity: configProgress.value === NavigationSteps.SHOW_GAS ? withTiming(1, fadeConfig) : withTiming(0, fadeConfig),
      flex: 1,
    };
  });

  return (
    <Box as={Animated.View} zIndex={12} style={styles} testID="gas-panel" width="full">
      <Stack alignHorizontal="center" space="28px">
        <Text weight="heavy" color="label" size="20pt">
          {i18n.t(i18n.l.gas.gas_settings)}
        </Text>

        <Box gap={24} width="full" alignItems="stretch">
          <CurrentBaseFee />

          <EditableGasSettings />

          <Separator color="separatorSecondary" />

          <MaxTransactionFee />
        </Box>
      </Stack>
    </Box>
  );
}
