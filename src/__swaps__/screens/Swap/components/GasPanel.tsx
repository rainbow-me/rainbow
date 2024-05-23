import * as i18n from '@/languages';
import React, { PropsWithChildren } from 'react';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { fadeConfig } from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ChainId } from '@/__swaps__/types/chains';
import { gweiToWei, weiToGwei } from '@/__swaps__/utils/ethereum';
import { getCachedGasSuggestions, useBaseFee, useGasTrend } from '@/__swaps__/utils/meteorology';
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
import { GasSettings, getCustomGasSettings, useCustomGasStore } from '../hooks/useCustomGas';
import { useSwapEstimatedGasFee } from '../hooks/useEstimatedGasFee';
import { getSelectedGasSpeed, setSelectedGasSpeed } from '../hooks/useSelectedGas';

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
  onChange,
  min = '0',
  value = min || '0',
}: {
  onChange: (v: string) => void;
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

function EditMaxBaseFee() {
  const maxBaseFee = useUnsavedCustomGasStore(s => s?.maxBaseFee);
  const { navigate } = useNavigation();

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      {/* TODO: Add error and warning values here */}
      <PressableLabel onPress={() => navigate(Routes.EXPLAIN_SHEET, { type: MAX_BASE_FEE_TYPE })}>
        {i18n.t(i18n.l.gas.max_base_fee)}
      </PressableLabel>
      <GasSettingInput value={maxBaseFee} onChange={maxBaseFee => setUnsavedCustomGasStore({ maxBaseFee })} />
    </Inline>
  );
}

const MIN_FLASHBOTS_PRIORITY_FEE = gweiToWei('6');
function EditPriorityFee() {
  const maxPriorityFee = useUnsavedCustomGasStore(s => s?.maxPriorityFee);
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
      <GasSettingInput value={maxPriorityFee} onChange={maxPriorityFee => setUnsavedCustomGasStore({ maxPriorityFee })} min={min} />
    </Inline>
  );
}

// function EditGasPrice() {
//   const gasPrice = useUnsavedCustomGasStore(s => s?.gasPrice || '0');
//   const { navigate } = useNavigation();

//   return (
//     <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
//       {/* TODO: Add error and warning values here */}
//       <PressableLabel onPress={() => navigate(Routes.EXPLAIN_SHEET, { type: MAX_BASE_FEE_TYPE })}>
//         {i18n.t(i18n.l.gas.max_base_fee)}
//       </PressableLabel>
//       <GasSettingInput value={gasPrice} onChange={gasPrice => setUnsavedCustomGasStore({ gasPrice })} />
//     </Inline>
//   );
// }

function MaxTransactionFee() {
  const { isDarkMode } = useColorMode();

  const gasSettings = useUnsavedCustomGasStore();
  const maxTransactionFee = useSwapEstimatedGasFee({ gasSettings });

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

type UnsavedSetting = { type: 'suggestion' | 'user inputed' } & GasSettings;
const useUnsavedCustomGasStore = createRainbowStore<UnsavedSetting | undefined>(() => undefined);
const setUnsavedCustomGasStore = (settings: Partial<UnsavedSetting>) => {
  useUnsavedCustomGasStore.setState(s => ({
    isEIP1559: true,
    type: 'user inputed',
    maxBaseFee: settings.maxBaseFee || s?.maxBaseFee || '0',
    maxPriorityFee: settings.maxPriorityFee || s?.maxPriorityFee || '0',
  }));
};

function EditableGasSettings() {
  // if (settings && !settings.isEIP1559) return <EditGasPrice />;
  return (
    <>
      <EditMaxBaseFee />
      <EditPriorityFee />
    </>
  );
}

export function onOpenGasPanel() {
  /*
    when opening the gas panel, and the previously selected speed was NOT custom,
    we prefill the custom gas settings with the selected suggestion
    when closing this panel, if the user didn't modify the settings, we keep the selected gas speed the same as before

    ex: was on fast, taps custom, don't change anything and closes, we keep the selected speed as fast
  */
  const chainId = useSwapsStore.getState().inputAsset?.chainId || ChainId.mainnet;
  const selectedSpeed = getSelectedGasSpeed(chainId);
  const suggestions = getCachedGasSuggestions(chainId);

  const customGasSettings = getCustomGasSettings(chainId);
  if (selectedSpeed === 'custom' && customGasSettings) {
    useUnsavedCustomGasStore.setState({ ...customGasSettings, type: 'user inputed' });
    return;
  }

  const suggestion = suggestions?.[selectedSpeed === 'custom' ? 'fast' : selectedSpeed];
  if (!suggestion || !suggestion.isEIP1559) return;

  useUnsavedCustomGasStore.setState({ ...suggestion, type: 'suggestion' });
}

function saveCustomGasSettings() {
  const unsaved = useUnsavedCustomGasStore.getState();
  if (!unsaved || unsaved.type === 'suggestion') return;

  const { inputAsset } = useSwapsStore.getState();
  const chainId = inputAsset?.chainId || ChainId.mainnet;
  useCustomGasStore.setState({ [chainId]: unsaved });
  setSelectedGasSpeed(chainId, 'custom');
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
