import React, { useCallback, type PropsWithChildren, type ReactNode } from 'react';
import { Platform, type LayoutChangeEvent } from 'react-native';

import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, withDelay, withSpring } from 'react-native-reanimated';

import { ACTION_BUTTON_HEIGHT } from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps } from '@/__swaps__/screens/Swap/hooks/useSwapNavigation';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Bleed, Box, globalColors, Inline, Separator, Stack, Text, useColorMode, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { gweiToWei, weiToGwei } from '@/features/gas/core/gasParams';
import { setCustomGasSettings, setSelectedGasSpeed } from '@/features/gas/data/gasSettingsStore';
import { useMeteorologyStore } from '@/features/gas/data/meteorologyStore';
import { GasSpeed } from '@/features/gas/types/gasSpeed';
import gasUtils from '@/features/gas/utils/gas';
import { ChainId } from '@/features/network/types/backendNetworks';
import { add, formatNumber, isZero, lessThan, subtract } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { gasTrendToTrendType, type ExplainSheetParams } from '@/navigation/types';
import {
  setGasPanelState,
  useGasPanelStore,
  useSwapBaseFeeDisplay,
  useSwapGasPanelSettings,
  useSwapGasPrice,
  useSwapMaxBaseFee,
  useSwapMaxBaseFeeWarning,
  useSwapMaxPriorityFee,
} from '@/state/swaps/gasStore';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

import { EstimatedSwapGasFee, EstimatedSwapGasFeeSlot } from './EstimatedSwapGasFee';
import { UnmountOnAnimatedReaction } from './UnmountOnAnimatedReaction';

const { GAS_TRENDS } = gasUtils;

const MINER_TIP_TYPE = 'minerTip';
const MAX_BASE_FEE_TYPE = 'maxBaseFee';

function UnmountWhenGasPanelIsClosed({ placeholder, children }: PropsWithChildren<{ placeholder: ReactNode }>) {
  const { configProgress } = useSwapContext();
  return (
    <UnmountOnAnimatedReaction
      isMountedWorklet={() => {
        'worklet';
        // only mounted when custom gas panel is open
        return configProgress.value === NavigationSteps.SHOW_GAS;
      }}
      placeholder={placeholder}
    >
      {children}
    </UnmountOnAnimatedReaction>
  );
}

function PressableLabel({ onPress, children }: PropsWithChildren<{ onPress: VoidFunction }>) {
  return (
    <Box as={ButtonPressAnimation} paddingVertical="8px" marginVertical="-8px" onPress={onPress} style={{ maxWidth: 175 }}>
      <Inline horizontalSpace="4px" alignVertical="center">
        <Text color="labelTertiary" size="15pt" weight="semibold" numberOfLines={2}>
          {`${children} `}
          <Text size="13pt" color={'labelTertiary'} weight="bold" numberOfLines={1}>
            􀅴
          </Text>
        </Text>
        <Box marginBottom={Platform.OS === 'android' ? '-4px' : undefined}></Box>
      </Inline>
    </Box>
  );
}

function NumericInputButton({ children, onPress }: PropsWithChildren<{ onPress: VoidFunction }>) {
  const { isDarkMode } = useColorMode();

  const fillSecondary = useForegroundColor('fillSecondary');
  const labelTertiary = useForegroundColor('labelTertiary');

  return (
    <ButtonPressAnimation onPress={onPress}>
      <Box
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 1,
          paddingLeft: 1,
          borderWidth: 1,
          borderColor: isDarkMode ? globalColors.white10 : globalColors.grey20,
          backgroundColor: opacity(fillSecondary, 0.12),
        }}
        height={{ custom: 16 }}
        width={{ custom: 20 }}
        borderRadius={100}
        paddingVertical="1px (Deprecated)"
      >
        <Text weight="black" size="icon 10px" color={{ custom: opacity(labelTertiary, 0.56) }}>
          {children}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}

const minStep = gweiToWei('0.0001');
const getStep = () => {
  const chainId = useSwapsStore.getState().inputAsset?.chainId;
  if (!chainId) return minStep;

  const baseFee = useMeteorologyStore.getState().get(chainId)?.currentBaseFee;
  if (!baseFee) return minStep;

  const step = 10 ** (baseFee.length - 2);
  return step;
};
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
            const step = getStep();
            const newValue = subtract(value, step);
            onChange(lessThan(newValue, min) || lessThan(newValue, minStep) ? min : newValue);
          }}
        >
          􀅽
        </NumericInputButton>

        <Text size="15pt" weight="bold" color="labelSecondary" tabularNumbers>
          {formatNumber(weiToGwei(value))}
        </Text>

        <NumericInputButton
          onPress={() => {
            const step = getStep();
            onChange(add(value, step));
          }}
        >
          􀅼
        </NumericInputButton>
      </Inline>

      <Text align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
        Gwei
      </Text>
    </Inline>
  );
}

function CurrentBaseFeeSlot({ baseFee, gasTrend = 'notrend' }: { baseFee?: string; gasTrend?: keyof typeof GAS_TRENDS }) {
  const { isDarkMode } = useColorMode();
  const { navigate } = useNavigation();

  const label = useForegroundColor('label');
  const labelSecondary = useForegroundColor('labelSecondary');

  const onPressLabel = () => {
    if (!baseFee || !gasTrend) return;

    const trendType = gasTrendToTrendType[gasTrend];
    const params: ExplainSheetParams<typeof trendType> = {
      type: trendType,
      currentBaseFee: baseFee,
      currentGasTrend: gasTrend,
    };
    navigate(Routes.EXPLAIN_SHEET, params);
  };

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      <PressableLabel onPress={onPressLabel}>{i18n.t(i18n.l.gas.current_base_fee)}</PressableLabel>
      <Bleed top="16px">
        <Stack space="8px">
          <Text
            align="right"
            color={{
              custom: GAS_TRENDS[gasTrend].color,
            }}
            size="13pt"
            weight="bold"
            style={{ textTransform: 'capitalize' }}
          >
            {GAS_TRENDS[gasTrend].label}
          </Text>
          <Text
            align="right"
            color={{ custom: isDarkMode ? labelSecondary : label }}
            size="15pt"
            weight="heavy"
            style={{ textTransform: 'capitalize' }}
          >
            {baseFee}
          </Text>
        </Stack>
      </Bleed>
    </Inline>
  );
}

function CurrentBaseFee() {
  const { baseFee, gasTrend } = useSwapBaseFeeDisplay();
  return <CurrentBaseFeeSlot baseFee={baseFee} gasTrend={gasTrend} />;
}

function Warning({ children }: { children: string }) {
  const [prefix, description] = children.split('·');

  return (
    <Text color="orange" size="13pt" weight="medium">
      {prefix.trim()}
      {' · '}
      <Text color="labelQuaternary" size="13pt" weight="medium">
        {description.trim()}
      </Text>
    </Text>
  );
}

function EditMaxBaseFee() {
  const { navigate } = useNavigation();
  const maxBaseFee = useSwapMaxBaseFee();
  const warning = useSwapMaxBaseFeeWarning();

  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
      <Box gap={8} style={{ marginTop: warning ? -10 : 0, marginBottom: warning ? -10 : 0 }}>
        <PressableLabel onPress={() => navigate(Routes.EXPLAIN_SHEET, { type: MAX_BASE_FEE_TYPE })}>
          {i18n.t(i18n.l.gas.max_base_fee)}
        </PressableLabel>
        {warning && <Warning>{warning}</Warning>}
      </Box>
      <GasSettingInput value={maxBaseFee} onChange={maxBaseFee => setGasPanelState({ maxBaseFee })} />
    </Box>
  );
}

function EditPriorityFee() {
  const { navigate } = useNavigation();
  const maxPriorityFee = useSwapMaxPriorityFee();

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      <PressableLabel onPress={() => navigate(Routes.EXPLAIN_SHEET, { type: MINER_TIP_TYPE })}>
        {i18n.t(i18n.l.gas.miner_tip)}
      </PressableLabel>
      <GasSettingInput value={maxPriorityFee} onChange={maxPriorityFee => setGasPanelState({ maxPriorityFee })} min={'0'} />
    </Inline>
  );
}

function EditGasPrice() {
  const { navigate } = useNavigation();
  const gasPrice = useSwapGasPrice();

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      <PressableLabel onPress={() => navigate(Routes.EXPLAIN_SHEET, { type: MAX_BASE_FEE_TYPE })}>
        {i18n.t(i18n.l.gas.gas_price)}
      </PressableLabel>
      <GasSettingInput value={gasPrice} onChange={gasPrice => setGasPanelState({ gasPrice })} />
    </Inline>
  );
}

function MaxTransactionFee() {
  const { isDarkMode } = useColorMode();
  const gasSettings = useSwapGasPanelSettings();

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      <Text color="labelTertiary" weight="semibold" size="15pt">
        {i18n.t(i18n.l.gas.max_transaction_fee)}
      </Text>

      <Inline horizontalSpace="6px">
        <UnmountWhenGasPanelIsClosed
          placeholder={
            <EstimatedSwapGasFeeSlot align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy" text="--" />
          }
        >
          <EstimatedSwapGasFee
            gasSettings={gasSettings}
            align="right"
            color={isDarkMode ? 'labelSecondary' : 'label'}
            size="15pt"
            weight="heavy"
          />
        </UnmountWhenGasPanelIsClosed>
      </Inline>
    </Inline>
  );
}

function EditableGasSettings() {
  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const normalGas = useMeteorologyStore(s => s.get(chainId)?.suggestions.normal);
  const showPriorityFee = !normalGas || (normalGas.isEIP1559 && !isZero(normalGas.maxPriorityFee));

  if (normalGas && !normalGas.isEIP1559) return <EditGasPrice />;

  return (
    <>
      <UnmountWhenGasPanelIsClosed placeholder={<CurrentBaseFeeSlot />}>
        <CurrentBaseFee />
      </UnmountWhenGasPanelIsClosed>
      <EditMaxBaseFee />
      {showPriorityFee && <EditPriorityFee />}
    </>
  );
}

function saveCustomGasSettings() {
  const unsaved = useGasPanelStore.getState();
  if (!unsaved) return;

  const { inputAsset } = useSwapsStore.getState();
  const chainId = inputAsset?.chainId || ChainId.mainnet;

  const settings = useSwapGasPanelSettings.getState();
  if (!settings) return;

  setCustomGasSettings(chainId, settings);
  setSelectedGasSpeed(chainId, GasSpeed.CUSTOM);
  useGasPanelStore.setState(undefined);
}

export function GasPanel() {
  const { configProgress, gasPanelHeight } = useSwapContext();
  const separator = useForegroundColor('separator');

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (height > 0) {
        gasPanelHeight.value = height + ACTION_BUTTON_HEIGHT;
      }
    },
    [gasPanelHeight]
  );

  useAnimatedReaction(
    () => configProgress.value,
    (current, previous) => {
      // persist custom gas settings when navigating away from gas panel
      if (previous === NavigationSteps.SHOW_GAS && current !== NavigationSteps.SHOW_GAS) {
        runOnJS(saveCustomGasSettings)();
      }
    },
    []
  );

  const styles = useAnimatedStyle(() => {
    return {
      display: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'flex',
      pointerEvents: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'auto',
      opacity:
        configProgress.value === NavigationSteps.SHOW_GAS
          ? withDelay(120, withSpring(1, SPRING_CONFIGS.springConfig))
          : withSpring(0, SPRING_CONFIGS.springConfig),
    };
  });

  return (
    <Box as={Animated.View} paddingHorizontal="12px" zIndex={12} style={styles} testID="gas-panel" width="full" onLayout={onLayout}>
      <Stack alignHorizontal="center" space="28px">
        <Text weight="heavy" color="label" size="20pt">
          {i18n.t(i18n.l.gas.gas_settings)}
        </Text>

        <Box gap={24} width="full" alignItems="stretch" marginBottom={{ custom: 30 }}>
          <Box gap={24}>
            <EditableGasSettings />
          </Box>

          <Separator color={{ custom: opacity(separator, 0.03) }} thickness={THICK_BORDER_WIDTH} />

          <MaxTransactionFee />
        </Box>
      </Stack>
    </Box>
  );
}
