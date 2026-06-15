import React, { memo, useCallback, useMemo, type ReactNode } from 'react';

import Animated, {
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { clamp, getColorValueForThemeWorklet, parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { AccountImage } from '@/components/AccountImage';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { NumberPad } from '@/components/number-pad/NumberPad';
import { DecoyScrollView } from '@/components/sheet/DecoyScrollView';
import { Box, useColorMode, useForegroundColor } from '@/design-system';
import { GasSpeed } from '@/features/gas/types/gasSpeed';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { SLIDER_MAX, type SliderColors } from '@/features/perps/components/Slider/Slider';
import { SliderWithLabels } from '@/features/perps/components/Slider/SliderWithLabels';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { divWorklet, equalWorklet, greaterThanWorklet, lessThanWorklet, mulWorklet } from '@/framework/core/safeMath';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { sanitizeAmount } from '@/worklets/strings';

import { createDepositConfig } from '../config';
import { FOOTER_HEIGHT, NavigationSteps, SLIDER_WIDTH, SLIDER_WITH_LABELS_HEIGHT } from '../constants';
import { DepositProvider, useDepositContext } from '../contexts/DepositContext';
import { computeMaxSwappableAmount } from '../stores/createDepositStore';
import {
  DepositQuoteStatus,
  getAccentColor,
  type DepositConfigInput,
  type DepositRuntimeExtensions,
  type FundingScreenTheme,
} from '../types';
import { amountFromSliderProgress } from '../utils/sliderWorklets';
import { resolveInitialDepositAsset } from '../utils/sourceAsset';
import { DepositAmountInput } from './deposit/DepositAmountInput';
import { DepositFooter } from './deposit/DepositFooter';
import { DepositInputContainer } from './deposit/DepositInputContainer';
import { DepositTokenList } from './deposit/DepositTokenList';

// ============ Types ========================================================== //

type DepositScreenProps = {
  config: DepositConfigInput;
  runtimeExtensions?: DepositRuntimeExtensions;
  theme: FundingScreenTheme;
};

// ============ Main Screen ==================================================== //

export const DepositScreen = memo(function DepositScreen({ config, runtimeExtensions, theme }: DepositScreenProps) {
  const resolvedConfig = useMemo(() => createDepositConfig(config), [config]);
  const resolvedInitialAsset = useStableValue(() => resolveInitialDepositAsset(resolvedConfig));

  return (
    <DepositProvider
      config={resolvedConfig}
      initialAsset={resolvedInitialAsset}
      initialGasSpeed={GasSpeed.FAST}
      runtimeExtensions={runtimeExtensions}
      theme={theme}
    >
      <DepositScreenContent />
    </DepositProvider>
  );
});

// ============ Worklets ======================================================= //

function getInputAmountError(
  amount: string,
  balance: string,
  minAmount: string | undefined
): DepositQuoteStatus.BelowMinimum | DepositQuoteStatus.InsufficientBalance | DepositQuoteStatus.ZeroAmountError | null {
  'worklet';
  if (equalWorklet(amount, '0')) return DepositQuoteStatus.ZeroAmountError;
  if (minAmount && lessThanWorklet(amount, minAmount)) return DepositQuoteStatus.BelowMinimum;
  if (greaterThanWorklet(amount, balance)) return DepositQuoteStatus.InsufficientBalance;
  return null;
}

// ============ Screen Content ================================================= //

const DepositScreenContent = memo(function DepositScreenContent() {
  const {
    config,
    displayedAmount,
    fields,
    gasStores,
    handleDeposit,
    handleNumberPadChange,
    inputMethod,
    isSubmitting,
    minifiedAsset,
    theme,
  } = useDepositContext();

  const { isDarkMode } = useColorMode();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const insets = useSafeAreaInsets();

  const inputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const maxSwappableAmount = useStoreSharedValue(gasStores.useMaxSwappableAmount, state => state);

  const assetColor = useDerivedValue(() => {
    const highContrastColor = minifiedAsset.value?.highContrastColor;
    if (!highContrastColor) return separatorSecondary;
    return getColorValueForThemeWorklet(highContrastColor, isDarkMode);
  });

  const sliderColors = useSharedValue<SliderColors>({
    activeLeft: separatorSecondary,
    activeRight: separatorSecondary,
    inactiveLeft: separatorSecondary,
    inactiveRight: separatorSecondary,
  });

  useAnimatedReaction(
    () => assetColor.value,
    color => {
      sliderColors.value = {
        activeLeft: color,
        activeRight: separatorSecondary,
        inactiveLeft: color,
        inactiveRight: separatorSecondary,
      };
    },
    [separatorSecondary]
  );

  const minAmountValue = config.validation?.minAmount?.value;

  const inputAmountErrorShared = useDerivedValue(() => {
    const balance = maxSwappableAmount.value || '0';
    return getInputAmountError(displayedAmount.value, balance, minAmountValue);
  });

  const focusedSearchNavbarStyle = useAnimatedStyle(() => {
    const isSearchFocused = inputProgress.value === NavigationSteps.SEARCH_FOCUSED;
    return {
      opacity: withTiming(isSearchFocused ? 0 : 1, TIMING_CONFIGS.fadeConfig),
      pointerEvents: isSearchFocused ? 'none' : 'auto',
    };
  });

  const accentColor = getAccentColor(theme, isDarkMode);

  return (
    <PerpsAccentColorContextProvider primaryColorOverride={accentColor}>
      <Box
        as={Page}
        backgroundColor={isDarkMode ? theme.backgroundDark : theme.backgroundLight}
        flex={1}
        height="full"
        testID="deposit-screen"
        width="full"
      >
        <Animated.View style={focusedSearchNavbarStyle}>
          <SheetHandle backgroundColor={isDarkMode ? theme.backgroundDark : theme.backgroundLight} withoutGradient />
        </Animated.View>
        <Box as={Animated.View} paddingVertical="8px" style={focusedSearchNavbarStyle}>
          <Navbar hasStatusBarInset leftComponent={<AccountImage />} title={config.labels.title} />
        </Box>

        <Box alignItems="center">
          <DepositInput inputProgress={inputProgress} />
        </Box>

        <Box paddingTop="4px">
          <DepositSlider assetColor={assetColor} sliderColors={sliderColors} />

          <NumberPad activeFieldId={inputMethod} fields={fields} onValueChange={handleNumberPadChange} stripFormatting={sanitizeAmount} />

          <Box
            alignItems="center"
            flexDirection="row"
            gap={12}
            height={{ custom: FOOTER_HEIGHT }}
            marginBottom={{ custom: insets.bottom }}
            paddingBottom="8px"
            paddingHorizontal="20px"
            paddingTop="16px"
            width="full"
          >
            <DepositFooter inputAmountError={inputAmountErrorShared} isSubmitting={isSubmitting} onSubmit={handleDeposit} />
          </Box>
        </Box>
      </Box>
    </PerpsAccentColorContextProvider>
  );
});

// ============ Slider ========================================================= //

const DepositSlider = ({ assetColor, sliderColors }: { assetColor: SharedValue<string>; sliderColors: SharedValue<SliderColors> }) => {
  const { handlePressMaxWorklet, handleSliderBeginWorklet, sliderProgress, useDepositStore } = useDepositContext();
  const isAssetSelected = useDepositStore(state => state.hasAsset());

  return (
    <SliderWithLabels
      colors={sliderColors}
      containerStyle={{ height: SLIDER_WITH_LABELS_HEIGHT, justifyContent: 'center', marginHorizontal: 20 }}
      icon={<SliderCoinIcon />}
      isEnabled={isAssetSelected}
      labels={{
        disabledText: i18n.t(i18n.l.perps.deposit.no_balance),
        title: i18n.t(i18n.l.perps.deposit.slider_label),
      }}
      maxButtonColor={assetColor}
      onGestureBeginWorklet={handleSliderBeginWorklet}
      onPressMaxWorklet={handlePressMaxWorklet}
      progressValue={sliderProgress}
      showMaxButton={true}
      showPercentage={true}
      width={SLIDER_WIDTH}
    />
  );
};

// ============ Input ========================================================== //

const DepositInput = ({ inputProgress }: { inputProgress: SharedValue<number> }) => {
  const {
    config,
    depositActions,
    displayedAmount,
    displayedNativeValue,
    gasStores,
    handleInputMethodChangeWorklet,
    inputMethod,
    setInputAmounts,
    useAmountStore,
  } = useDepositContext();

  const isSourceSelectable = config.source.mode === 'selectable';

  const handleSelectAsset = useCallback(
    (assetParam: ParsedSearchAsset | null) => {
      const extendedAsset = parseAssetAndExtend({ asset: assetParam, insertUserAssetBalance: true });
      if (!extendedAsset) return;

      const currentMaxSwappable = gasStores.useMaxSwappableAmount.getState() || '0';
      const isBalanceZero = equalWorklet(currentMaxSwappable, '0');
      const previousAmount = useAmountStore.getState().amount;
      const estimatedSliderProgress =
        Number(mulWorklet(divWorklet(previousAmount, currentMaxSwappable, '0'), SLIDER_MAX)) || config.initialSliderProgress;
      const newSliderProgress = isBalanceZero ? 0 : clamp(estimatedSliderProgress, 0, SLIDER_MAX);

      const assetDecimals = extendedAsset?.decimals ?? 18;
      const assetPrice = extendedAsset?.price?.value ?? 0;
      const maxSwappableAmount =
        computeMaxSwappableAmount(
          extendedAsset,
          gasStores.useGasSettings.getState(),
          gasStores.useGasLimitStore.getState().getData() ?? undefined
        ) || '0';

      const { amount } = amountFromSliderProgress(newSliderProgress, maxSwappableAmount, assetPrice, assetDecimals);
      depositActions.setAsset(extendedAsset);
      useAmountStore.getState().setAmount(amount);

      runOnUI(() => {
        setInputAmounts({
          assetDecimals,
          assetPrice,
          maxSwappableAmount,
          progress: newSliderProgress,
        });
      })();
    },
    [config.initialSliderProgress, depositActions, gasStores, setInputAmounts, useAmountStore]
  );

  const handleOpenTokenList = useCallback(() => {
    'worklet';
    if (!isSourceSelectable) return;
    inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
  }, [inputProgress, isSourceSelectable]);

  const tokenListOverlay = useMemo(() => {
    if (!isSourceSelectable) return null;

    return (
      <TokenListOverlay inputProgress={inputProgress}>
        <DepositTokenList
          inputProgress={inputProgress}
          onSelectToken={token => {
            inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
            handleSelectAsset(token);
          }}
        />
        <DecoyScrollView />
      </TokenListOverlay>
    );
  }, [handleSelectAsset, inputProgress, isSourceSelectable]);

  return (
    <DepositInputContainer progress={inputProgress}>
      <DepositInputWrapper inputProgress={inputProgress}>
        <Box flexGrow={1}>
          <DepositAmountInput
            displayedAmount={displayedAmount}
            displayedNativeValue={displayedNativeValue}
            inputMethod={inputMethod}
            isSourceSelectable={isSourceSelectable}
            onChangeInputMethodWorklet={handleInputMethodChangeWorklet}
            onSelectAssetWorklet={handleOpenTokenList}
          />
        </Box>
      </DepositInputWrapper>

      {tokenListOverlay}
    </DepositInputContainer>
  );
};

// ============ Overlays ======================================================= //

const TokenListOverlay = ({ children, inputProgress }: { children: ReactNode; inputProgress: SharedValue<number> }) => {
  const overlayStyle = useAnimatedStyle(() => {
    const isVisible = inputProgress.value !== NavigationSteps.INPUT_ELEMENT_FOCUSED;
    return {
      opacity: withTiming(isVisible ? 1 : 0, TIMING_CONFIGS.fadeConfig),
      pointerEvents: isVisible ? 'auto' : 'none',
      zIndex: isVisible ? 10 : -1,
    };
  });

  return <Animated.View style={[{ height: '100%', position: 'absolute', top: 24, width: '100%' }, overlayStyle]}>{children}</Animated.View>;
};

const DepositInputWrapper = ({ children, inputProgress }: { children: ReactNode; inputProgress: SharedValue<number> }) => {
  const inputWrapperStyle = useAnimatedStyle(() => {
    const isVisible = inputProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED;
    return {
      opacity: withTiming(isVisible ? 1 : 0, TIMING_CONFIGS.fadeConfig),
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  return <Animated.View style={[{ flex: 1 }, inputWrapperStyle]}>{children}</Animated.View>;
};

// ============ Coin Icon ====================================================== //

const SliderCoinIcon = () => {
  const { useDepositStore } = useDepositContext();
  const asset = useDepositStore(state => state.asset);
  if (!asset) return null;
  return <RainbowCoinIcon chainId={asset.chainId} icon={asset.icon_url} showBadge={false} size={16} symbol={asset.symbol} />;
};
