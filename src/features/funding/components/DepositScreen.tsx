import React, { memo, ReactNode, useCallback, useMemo } from 'react';
import Animated, {
  runOnUI,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { GasSpeed } from '@/__swaps__/types/gas';
import { clamp, getColorValueForThemeWorklet, parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { AccountImage } from '@/components/AccountImage';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { DecoyScrollView } from '@/components/sheet/DecoyScrollView';
import { Box, useColorMode, useForegroundColor } from '@/design-system';
import { NumberPad } from '@/features/perps/components/NumberPad/NumberPad';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { SliderWithLabels } from '@/features/perps/components/Slider';
import { SLIDER_MAX, SliderColors } from '@/features/perps/components/Slider/Slider';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { FOOTER_HEIGHT, SLIDER_WIDTH, SLIDER_WITH_LABELS_HEIGHT } from '@/features/perps/screens/perps-deposit-withdraw-screen/constants';
import { INITIAL_SLIDER_PROGRESS } from '@/features/perps/screens/perps-deposit-withdraw-screen/shared/constants';
import { amountFromSliderProgress } from '@/features/perps/screens/perps-deposit-withdraw-screen/shared/worklets';
import * as i18n from '@/languages';
import { divWorklet, equalWorklet, greaterThanWorklet, mulWorklet } from '@/safe-math/SafeMath';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { sanitizeAmount } from '@/worklets/strings';
import { DepositProvider, useDepositContext } from '../contexts/DepositContext';
import { computeMaxSwappableAmount } from '../stores/createDepositStore';
import { DepositConfig, FundingScreenTheme, getAccentColor } from '../types';
import { DepositAmountInput } from './deposit/DepositAmountInput';
import { DepositFooter } from './deposit/DepositFooter';
import { DepositInputContainer } from './deposit/DepositInputContainer';
import { DepositTokenList } from './deposit/DepositTokenList';

// ============ Types ========================================================== //

type DepositScreenProps = {
  config: DepositConfig;
  theme: FundingScreenTheme;
};

// ============ Navigation ===================================================== //

const enum NavigationSteps {
  INPUT_ELEMENT_FOCUSED = 0,
  TOKEN_LIST_FOCUSED = 1,
}

// ============ Helpers ======================================================== //

function getInputAmountError(amount: string, balance: string): 'overBalance' | 'zero' | null {
  'worklet';
  if (equalWorklet(amount, '0')) return 'zero';
  if (greaterThanWorklet(amount, balance)) return 'overBalance';
  return null;
}

// ============ Main Screen ==================================================== //

export const DepositScreen = memo(function DepositScreen({ config, theme }: DepositScreenProps) {
  const highestValueNativeAsset = useUserAssetsStore.getState().getHighestValueNativeAsset();
  const initialAsset = highestValueNativeAsset ? parseAssetAndExtend({ asset: highestValueNativeAsset }) : null;

  return (
    <DepositProvider config={config} initialAsset={initialAsset} initialGasSpeed={GasSpeed.FAST} theme={theme}>
      <DepositScreenContent />
    </DepositProvider>
  );
});

// ============ Screen Content ================================================= //

const DepositScreenContent = memo(function DepositScreenContent() {
  const { isDarkMode } = useColorMode();
  const { displayedAmount, fields, gasStores, handleDeposit, handleNumberPadChange, inputMethod, isSubmitting, minifiedAsset, theme } =
    useDepositContext();
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

  const inputAmountErrorShared = useDerivedValue(() => {
    'worklet';
    const balance = maxSwappableAmount.value || '0';
    return getInputAmountError(displayedAmount.value, balance);
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
        <SheetHandle backgroundColor={isDarkMode ? theme.backgroundDark : theme.backgroundLight} withoutGradient />
        <Box paddingVertical="8px">
          <Navbar hasStatusBarInset leftComponent={<AccountImage />} title={i18n.t(i18n.l.perps.deposit.title)} />
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
            <DepositFooter inputAmountErrorShared={inputAmountErrorShared} isSubmitting={isSubmitting} onSubmit={handleDeposit} />
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
    depositActions,
    displayedAmount,
    displayedNativeValue,
    gasStores,
    handleInputMethodChangeWorklet,
    inputMethod,
    setInputAmounts,
    useAmountStore,
  } = useDepositContext();

  const handleSelectAsset = useCallback(
    (assetParam: ParsedSearchAsset | null) => {
      const extendedAsset = parseAssetAndExtend({ asset: assetParam, insertUserAssetBalance: true });
      if (!extendedAsset) return;

      const currentMaxSwappable = gasStores.useMaxSwappableAmount.getState() || '0';
      const isBalanceZero = equalWorklet(currentMaxSwappable, '0');
      const previousAmount = useAmountStore.getState().amount;
      const estimatedSliderProgress =
        Number(mulWorklet(divWorklet(previousAmount, currentMaxSwappable, '0'), SLIDER_MAX)) || INITIAL_SLIDER_PROGRESS;
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
    [depositActions, gasStores, setInputAmounts, useAmountStore]
  );

  const handleOpenTokenList = useCallback(() => {
    'worklet';
    inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
  }, [inputProgress]);

  return (
    <DepositInputContainer progress={inputProgress}>
      <DepositInputWrapper inputProgress={inputProgress}>
        <Box flexGrow={1}>
          <DepositAmountInput
            displayedAmount={displayedAmount}
            displayedNativeValue={displayedNativeValue}
            inputMethod={inputMethod}
            onChangeInputMethod={handleInputMethodChangeWorklet}
            onSelectAsset={handleOpenTokenList}
          />
        </Box>
      </DepositInputWrapper>

      {useMemo(
        () => (
          <TokenListOverlay inputProgress={inputProgress}>
            <DepositTokenList
              onSelectToken={token => {
                inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
                handleSelectAsset(token);
              }}
            />
            <DecoyScrollView />
          </TokenListOverlay>
        ),
        [handleSelectAsset, inputProgress]
      )}
    </DepositInputContainer>
  );
};

// ============ Overlays ======================================================= //

const TokenListOverlay = ({ children, inputProgress }: { children: ReactNode; inputProgress: SharedValue<number> }) => {
  const overlayStyle = useAnimatedStyle(() => {
    const isVisible = inputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED;
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
