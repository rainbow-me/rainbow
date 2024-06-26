import * as i18n from '@/languages';
import React, { PropsWithChildren, ReactNode, useCallback, useMemo } from 'react';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, withDelay, withSpring } from 'react-native-reanimated';

import { MIN_FLASHBOTS_PRIORITY_FEE, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ChainId } from '@/__swaps__/types/chains';
import { GasSpeed } from '@/__swaps__/types/gas';
import { gweiToWei, weiToGwei } from '@/__swaps__/utils/ethereum';
import {
  GasSuggestion,
  getCachedCurrentBaseFee,
  getSelectedSpeedSuggestion,
  useBaseFee,
  useGasTrend,
  useIsChainEIP1559,
  useMeteorologySuggestion,
  useMeteorologySuggestions,
} from '@/__swaps__/utils/meteorology';
import { add, formatNumber, greaterThan, multiply, subtract } from '@/__swaps__/utils/numbers';
import { opacity } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { Bleed, Box, Inline, Separator, Stack, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { lessThan } from '@/helpers/utilities';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { swapsStore, useSwapsStore } from '@/state/swaps/swapsStore';
import { gasUtils } from '@/utils';
import { upperFirst } from 'lodash';
import { GasSettings, getCustomGasSettings, setCustomGasSettings, useCustomGasStore } from '../hooks/useCustomGas';
import { getSelectedGas, setSelectedGasSpeed, useSelectedGasSpeed } from '../hooks/useSelectedGas';
import { EstimatedSwapGasFee, EstimatedSwapGasFeeSlot } from './EstimatedSwapGasFee';
import { UnmountOnAnimatedReaction } from './UnmountOnAnimatedReaction';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';

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

  const baseFee = getCachedCurrentBaseFee(chainId);
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

const selectBaseFee = (s: string | undefined = '0') => formatNumber(weiToGwei(s));

function CurrentBaseFeeSlot({ baseFee, gasTrend = 'notrend' }: { baseFee?: string; gasTrend?: keyof typeof GAS_TRENDS }) {
  const { isDarkMode } = useColorMode();
  const { navigate } = useNavigation();

  const label = useForegroundColor('label');
  const labelSecondary = useForegroundColor('labelSecondary');

  const onPressLabel = () => {
    if (!baseFee || !gasTrend) return;
    navigate(Routes.EXPLAIN_SHEET, {
      currentBaseFee: baseFee,
      currentGasTrend: gasTrend,
      type: 'currentBaseFee' + upperFirst(gasTrend),
    });
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
  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const { data: baseFee } = useBaseFee({ chainId, select: selectBaseFee });
  const { data: gasTrend } = useGasTrend({ chainId });
  return <CurrentBaseFeeSlot baseFee={baseFee} gasTrend={gasTrend} />;
}

type GasPanelState = { gasPrice?: string; maxBaseFee?: string; maxPriorityFee?: string };
const useGasPanelStore = createRainbowStore<GasPanelState | undefined>(() => undefined);

function useGasPanelState<
  Option extends 'maxBaseFee' | 'maxPriorityFee' | 'gasPrice' | undefined = undefined,
  Selected = Option extends string ? string : GasPanelState,
>(option?: Option, select: (s: GasPanelState | undefined) => Selected = s => (option ? s?.[option] : s) as Selected) {
  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const speed = useSelectedGasSpeed(chainId);

  const editedSetting = useGasPanelStore(select);
  const customSetting = useCustomGasStore(s => select(s?.[chainId]));
  const { data: suggestedSetting } = useMeteorologySuggestion({
    chainId,
    speed,
    select: useCallback((d?: GasSuggestion) => option && d?.[option], [option]),
    enabled: !editedSetting,
    notifyOnChangeProps: !editedSetting && speed !== 'custom' ? ['data'] : [],
  });

  if (editedSetting) return editedSetting;
  if (speed === GasSpeed.CUSTOM) return customSetting;
  return suggestedSetting;
}

const setGasPanelState = (update: Partial<GasPanelState>) => {
  const chainId = useSwapsStore.getState().inputAsset?.chainId || ChainId.mainnet;

  const currentGasSettings = getCustomGasSettings(chainId);
  if (currentGasSettings) useGasPanelStore.setState({ ...currentGasSettings, ...update });

  const suggestion = getSelectedSpeedSuggestion(chainId);
  useGasPanelStore.setState({ ...suggestion, ...update });
};

const likely_to_fail = i18n.t(i18n.l.gas.likely_to_fail);
const higher_than_suggested = i18n.t(i18n.l.gas.higher_than_suggested);
const lower_than_suggested = i18n.t(i18n.l.gas.lower_than_suggested);

const useMaxBaseFeeWarning = (maxBaseFee: string | undefined) => {
  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const { data: suggestions } = useMeteorologySuggestions({ chainId, enabled: !!maxBaseFee });
  const { data: currentBaseFee = '0' } = useBaseFee({ chainId });

  if (!maxBaseFee) return null;

  // likely to get stuck if less than 20% of current base fee
  if (lessThan(maxBaseFee, multiply(currentBaseFee, 0.2))) return likely_to_fail;

  // suggestions
  const { urgent, normal } = suggestions || {};
  const highThreshold = urgent?.maxBaseFee && multiply(urgent.maxBaseFee, 1.1);
  const lowThreshold = normal?.maxBaseFee && multiply(normal.maxBaseFee, 0.9);
  if (highThreshold && greaterThan(maxBaseFee, highThreshold)) return higher_than_suggested;
  if (lowThreshold && lessThan(maxBaseFee, lowThreshold)) return lower_than_suggested;

  return null;
};

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

  const maxBaseFee = useGasPanelState('maxBaseFee');

  const warning = useMaxBaseFeeWarning(maxBaseFee);

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

  const isFlashbotsEnabled = useSwapsStore(s => s.flashbots);
  const min = isFlashbotsEnabled ? MIN_FLASHBOTS_PRIORITY_FEE : '0';

  const maxPriorityFee = useGasPanelState('maxPriorityFee');

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      <PressableLabel onPress={() => navigate(Routes.EXPLAIN_SHEET, { type: MINER_TIP_TYPE })}>
        {i18n.t(i18n.l.gas.miner_tip)}
      </PressableLabel>
      <GasSettingInput value={maxPriorityFee} onChange={maxPriorityFee => setGasPanelState({ maxPriorityFee })} min={min} />
    </Inline>
  );
}

function EditGasPrice() {
  const { navigate } = useNavigation();

  const gasPrice = useGasPanelState('gasPrice');

  return (
    <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
      <PressableLabel onPress={() => navigate(Routes.EXPLAIN_SHEET, { type: MAX_BASE_FEE_TYPE })}>
        {i18n.t(i18n.l.gas.max_base_fee)}
      </PressableLabel>
      <GasSettingInput value={gasPrice} onChange={gasPrice => setGasPanelState({ gasPrice })} />
    </Inline>
  );
}

const stateToGasSettings = (s: GasPanelState | undefined): GasSettings | undefined => {
  if (!s) return getSelectedGas(swapsStore.getState().inputAsset?.chainId || ChainId.mainnet);
  if (s.gasPrice) return { isEIP1559: false, gasPrice: s.gasPrice || '0' };
  return { isEIP1559: true, maxBaseFee: s.maxBaseFee || '0', maxPriorityFee: s.maxPriorityFee || '0' };
};

function MaxTransactionFee() {
  const { isDarkMode } = useColorMode();

  const gasPanelState = useGasPanelState();
  const gasSettings = useMemo(() => stateToGasSettings(gasPanelState), [gasPanelState]);

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

const chainsThatIgnoreThePriorityFee = [ChainId.arbitrum, ChainId.arbitrumNova, ChainId.arbitrumSepolia];
function EditableGasSettings() {
  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const isEIP1559 = useIsChainEIP1559(chainId);

  if (!isEIP1559) return <EditGasPrice />;

  if (chainsThatIgnoreThePriorityFee.includes(chainId)) return <EditMaxBaseFee />;

  return (
    <>
      <EditMaxBaseFee />
      <EditPriorityFee />
    </>
  );
}

function saveCustomGasSettings() {
  const unsaved = useGasPanelStore.getState();
  if (!unsaved) return;

  const { inputAsset } = useSwapsStore.getState();
  const chainId = inputAsset?.chainId || ChainId.mainnet;

  setCustomGasSettings(chainId, unsaved);
  setSelectedGasSpeed(chainId, GasSpeed.CUSTOM);
  useGasPanelStore.setState(undefined);
}

export function GasPanel() {
  const { configProgress } = useSwapContext();
  const separator = useForegroundColor('separator');

  useAnimatedReaction(
    () => configProgress.value,
    (current, previous) => {
      // persist custom gas settings when navigating away from gas panel
      if (previous === NavigationSteps.SHOW_GAS && current !== NavigationSteps.SHOW_GAS) {
        runOnJS(saveCustomGasSettings)();
      }
    }
  );

  const styles = useAnimatedStyle(() => {
    return {
      display: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'flex',
      pointerEvents: configProgress.value !== NavigationSteps.SHOW_GAS ? 'none' : 'auto',
      opacity:
        configProgress.value === NavigationSteps.SHOW_GAS
          ? withDelay(120, withSpring(1, SPRING_CONFIGS.springConfig))
          : withSpring(0, SPRING_CONFIGS.springConfig),
      flex: 1,
    };
  });

  return (
    <Box as={Animated.View} paddingHorizontal="12px" zIndex={12} style={styles} testID="gas-panel" width="full">
      <Stack alignHorizontal="center" space="28px">
        <Text weight="heavy" color="label" size="20pt">
          {i18n.t(i18n.l.gas.gas_settings)}
        </Text>

        <Box gap={24} width="full" alignItems="stretch">
          <UnmountWhenGasPanelIsClosed placeholder={<CurrentBaseFeeSlot />}>
            <CurrentBaseFee />
          </UnmountWhenGasPanelIsClosed>

          <Box gap={24} height="64px">
            <EditableGasSettings />
          </Box>

          <Separator color={{ custom: opacity(separator, 0.03) }} thickness={THICK_BORDER_WIDTH} />

          <MaxTransactionFee />
        </Box>
      </Stack>
    </Box>
  );
}
