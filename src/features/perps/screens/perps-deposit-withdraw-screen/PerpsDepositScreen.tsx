import { GasSpeed } from '@/__swaps__/types/gas';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { parseAssetAndExtend, getColorValueForThemeWorklet, clamp } from '@/__swaps__/utils/swaps';
import { AccountImage } from '@/components/AccountImage';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { Box, Separator, useColorMode, useForegroundColor } from '@/design-system';
import { NumberPad } from '@/features/perps/components/NumberPad/NumberPad';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import * as i18n from '@/languages';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import React, { memo, ReactNode, useCallback, useMemo } from 'react';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  SharedValue,
  withTiming,
  runOnUI,
} from 'react-native-reanimated';
import { FOOTER_HEIGHT, SLIDER_WIDTH, SLIDER_WITH_LABELS_HEIGHT } from './constants';
import { PerpsInputContainer } from './PerpsInputContainer';
import { PerpsTokenList } from './PerpsTokenList';
import { DepositAmountInput } from './DepositAmountInput';
import { SliderWithLabels } from '@/features/perps/components/Slider';
import { SLIDER_MAX, SliderColors } from '@/features/perps/components/Slider/Slider';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { PerpsDepositProvider, usePerpsDepositContext } from './PerpsDepositContext';
import { GasButtonWrapper, SwapButton } from './DepositFooter';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { divWorklet, equalWorklet, greaterThanWorklet, mulWorklet } from '@/safe-math/SafeMath';
import { INITIAL_SLIDER_PROGRESS } from '@/features/perps/screens/perps-deposit-withdraw-screen/shared/constants';
import { computeMaxSwappableAmount } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/createPerpsDepositStore';
import { sanitizeAmount } from '@/worklets/strings';
import { amountFromSliderProgress } from '@/features/perps/screens/perps-deposit-withdraw-screen/shared/worklets';
import { DecoyScrollView } from '@/components/sheet/DecoyScrollView';

const enum NavigationSteps {
  INPUT_ELEMENT_FOCUSED = 0,
  TOKEN_LIST_FOCUSED = 1,
}

function getInputAmountError(amount: string, balance: string): 'zero' | 'overBalance' | null {
  'worklet';
  if (equalWorklet(amount, '0')) return 'zero';
  if (greaterThanWorklet(amount, balance)) return 'overBalance';
  return null;
}

export const PerpsDepositScreen = memo(function PerpsDepositScreen() {
  const highestValueNativeAsset = useUserAssetsStore.getState().getHighestValueNativeAsset();
  const initialAsset = highestValueNativeAsset ? parseAssetAndExtend({ asset: highestValueNativeAsset }) : null;
  return (
    <PerpsDepositProvider initialAsset={initialAsset} initialGasSpeed={GasSpeed.FAST}>
      <PerpsDepositScreenContent />
    </PerpsDepositProvider>
  );
});

const PerpsDepositScreenContent = memo(function PerpsDepositScreenContent() {
  const { isDarkMode } = useColorMode();
  const { displayedAmount, fields, gasStores, handleDeposit, handleNumberPadChange, inputMethod, minifiedAsset } = usePerpsDepositContext();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const insets = useSafeAreaInsets();

  const inputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const isSubmitting = useSharedValue(false);
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

  return (
    <PerpsAccentColorContextProvider>
      <Box
        as={Page}
        backgroundColor={isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT}
        flex={1}
        height="full"
        testID="perps-deposit-screen"
        width="full"
      >
        <SheetHandle />
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
            <GasButtonWrapper />
            <Box height={32}>
              <Separator color={'separatorTertiary'} direction="vertical" thickness={1} />
            </Box>
            <SwapButton inputAmountErrorShared={inputAmountErrorShared} isSubmitting={isSubmitting} onSwap={handleDeposit} />
          </Box>
        </Box>
      </Box>
    </PerpsAccentColorContextProvider>
  );
});

const DepositSlider = ({ assetColor, sliderColors }: { assetColor: SharedValue<string>; sliderColors: SharedValue<SliderColors> }) => {
  const { handlePressMaxWorklet, handleSliderBeginWorklet, sliderProgress, useDepositStore } = usePerpsDepositContext();
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
  } = usePerpsDepositContext();

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
      return;
    },
    [depositActions, gasStores, setInputAmounts, useAmountStore]
  );

  const handleOpenTokenList = useCallback(() => {
    'worklet';
    inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
  }, [inputProgress]);

  return (
    <PerpsInputContainer progress={inputProgress}>
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
            <PerpsTokenList
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
    </PerpsInputContainer>
  );
};

const TokenListOverlay = ({ inputProgress, children }: { inputProgress: SharedValue<number>; children: ReactNode }) => {
  const overlayStyle = useAnimatedStyle(() => {
    const isVisible = inputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED;
    return {
      opacity: withTiming(isVisible ? 1 : 0, TIMING_CONFIGS.fadeConfig),
      pointerEvents: isVisible ? 'auto' : 'none',
      zIndex: isVisible ? 10 : -1,
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: '100%',
          position: 'absolute',
          top: 24,
          width: '100%',
        },
        overlayStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const DepositInputWrapper = ({ inputProgress, children }: { inputProgress: SharedValue<number>; children: ReactNode }) => {
  const inputWrapperStyle = useAnimatedStyle(() => {
    const isVisible = inputProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED;
    return {
      opacity: withTiming(isVisible ? 1 : 0, TIMING_CONFIGS.fadeConfig),
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  return <Animated.View style={[{ flex: 1 }, inputWrapperStyle]}>{children}</Animated.View>;
};

const SliderCoinIcon = () => {
  const { useDepositStore } = usePerpsDepositContext();
  const asset = useDepositStore(state => state.asset);
  if (!asset) return null;
  return <RainbowCoinIcon chainId={asset.chainId} icon={asset.icon_url} showBadge={false} size={16} symbol={asset.symbol} />;
};
