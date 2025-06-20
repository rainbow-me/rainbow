// @refresh
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { InteractionManager, NativeModules, StyleProp, TextInput, TextStyle } from 'react-native';
import {
  AnimatedRef,
  DerivedValue,
  SharedValue,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { divWorklet, equalWorklet, lessThanOrEqualToWorklet, mulWorklet, sumWorklet } from '@/safe-math/SafeMath';
import {
  INITIAL_SLIDER_POSITION,
  SLIDER_COLLAPSED_HEIGHT,
  SLIDER_HEIGHT,
  SLIDER_WIDTH,
  snappySpringConfig,
} from '@/__swaps__/screens/Swap/constants';
import { useAnimatedSwapStyles } from '@/__swaps__/screens/Swap/hooks/useAnimatedSwapStyles';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { NavigationSteps, useSwapNavigation } from '@/__swaps__/screens/Swap/hooks/useSwapNavigation';
import { useSwapSettings } from '@/__swaps__/screens/Swap/hooks/useSwapSettings';
import { useSwapTextStyles } from '@/__swaps__/screens/Swap/hooks/useSwapTextStyles';
import { SwapWarningType, useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset, ParsedUserAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { SwapAssetType, InputKeys } from '@/__swaps__/types/swap';
import { clamp, getDefaultSlippageWorklet, parseAssetAndExtend, trimTrailingZeros } from '@/__swaps__/utils/swaps';
import { analytics } from '@/analytics';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { getProvider, getProviderViem } from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { loadWallet, loadWalletViem } from '@/model/wallet';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { walletExecuteRap } from '@/raps/execute';
import { RapSwapActionParameters } from '@/raps/references';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { getNextNonce } from '@/state/nonces';
import { CrosschainQuote, Quote, QuoteError, SwapType } from '@rainbow-me/swaps';
import { IS_IOS } from '@/env';
import { clearCustomGasSettings } from '../hooks/useCustomGas';
import { getGasSettingsBySpeed, getSelectedGas } from '../hooks/useSelectedGas';
import { useSwapOutputQuotesDisabled } from '../hooks/useSwapOutputQuotesDisabled';
import { SyncGasStateToSharedValues, SyncQuoteSharedValuesToState } from './SyncSwapStateAndSharedValues';
import { performanceTracking, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { getSwapsNavigationParams } from '../navigateToSwaps';
import showWalletErrorAlert from '@/helpers/support';
import { getRemoteConfig, useRemoteConfig } from '@/model/remoteConfig';
import { getInputValuesForSliderPositionWorklet, updateInputValuesAfterFlip } from '@/__swaps__/utils/flipAssets';
import { trackSwapEvent } from '@/__swaps__/utils/trackSwapEvent';
import { useWallets } from '@/hooks';
import { getShouldDelegate, walletExecuteWithDelegate } from '@/delegateActions';
import { ATOMIC_SWAPS, useExperimentalFlag } from '@/config';

const swapping = i18n.t(i18n.l.swap.actions.swapping);
const holdToSwap = i18n.t(i18n.l.swap.actions.hold_to_swap);
const holdToBridge = i18n.t(i18n.l.swap.actions.hold_to_bridge);
const done = i18n.t(i18n.l.button.done);
const enterAmount = i18n.t(i18n.l.swap.actions.enter_amount);
const review = i18n.t(i18n.l.swap.actions.review);
const fetchingPrices = i18n.t(i18n.l.swap.actions.fetching_prices);
const selectToken = i18n.t(i18n.l.swap.actions.select_token);
const insufficientFunds = i18n.t(i18n.l.swap.actions.insufficient_funds);
const insufficient = i18n.t(i18n.l.swap.actions.insufficient);
const quoteError = i18n.t(i18n.l.swap.actions.quote_error);

type ConfirmButtonProps = {
  label: string;
  icon?: string;
  disabled?: boolean;
  opacity?: number;
  type: 'hold' | 'tap';
};

interface SwapContextType {
  isFetching: SharedValue<boolean>;
  isSwapping: SharedValue<boolean>;
  isQuoteStale: SharedValue<number>;

  inputSearchRef: AnimatedRef<TextInput>;
  outputSearchRef: AnimatedRef<TextInput>;

  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  configProgress: SharedValue<NavigationSteps>;

  sliderXPosition: SharedValue<number>;
  sliderPressProgress: SharedValue<number>;

  lastTypedInput: SharedValue<InputKeys>;
  focusedInput: SharedValue<InputKeys>;

  selectedOutputChainId: SharedValue<ChainId>;
  setSelectedOutputChainId: (chainId: ChainId) => void;

  handleProgressNavigation: ({ type }: { type: SwapAssetType }) => void;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  setAsset: ({
    asset,
    didWalletChange,
    insertUserAssetBalance,
    type,
  }: {
    asset: ParsedSearchAsset | null;
    didWalletChange?: boolean;
    insertUserAssetBalance?: boolean;
    type: SwapAssetType;
  }) => void;

  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  executeSwap: () => void;
  quoteFetchingInterval: ReturnType<typeof useAnimatedInterval>;

  outputQuotesAreDisabled: DerivedValue<boolean>;
  swapInfo: DerivedValue<{
    areAllInputsZero: boolean;
    areBothAssetsSet: boolean;
    isBridging: boolean;
  }>;

  SwapSettings: ReturnType<typeof useSwapSettings>;
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  AnimatedSwapStyles: ReturnType<typeof useAnimatedSwapStyles>;
  SwapTextStyles: ReturnType<typeof useSwapTextStyles>;
  SwapNavigation: ReturnType<typeof useSwapNavigation>;
  SwapWarning: ReturnType<typeof useSwapWarning>;

  confirmButtonProps: DerivedValue<ConfirmButtonProps>;
  confirmButtonIconStyle: StyleProp<TextStyle>;

  hasEnoughFundsForGas: SharedValue<boolean | undefined>;
  gasPanelHeight: SharedValue<number>;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

interface SwapProviderProps {
  children: ReactNode;
}

const getInitialSliderXPosition = ({
  inputAmount,
  maxSwappableAmount,
  percentageToSell = INITIAL_SLIDER_POSITION,
}: {
  inputAmount: string | number | undefined;
  maxSwappableAmount: string | undefined;
  percentageToSell: number | undefined;
}) => {
  if (inputAmount && maxSwappableAmount) {
    return clamp(+mulWorklet(divWorklet(inputAmount, maxSwappableAmount), SLIDER_WIDTH), 0, SLIDER_WIDTH);
  }
  return SLIDER_WIDTH * percentageToSell;
};

const SLIPPAGE_CONFIG = getRemoteConfig().default_slippage_bips_chainId;

export const SwapProvider = ({ children }: SwapProviderProps) => {
  const [{ currentCurrency, initialValues, nativeChainAssets }] = useState(() => ({
    currentCurrency: userAssetsStoreManager.getState().currency,
    initialValues: getSwapsNavigationParams(),
    nativeChainAssets: useBackendNetworksStore.getState().getChainsNativeAsset(),
  }));
  const { isHardwareWallet } = useWallets();

  const inputSearchRef = useAnimatedRef<TextInput>();
  const outputSearchRef = useAnimatedRef<TextInput>();

  const isFetching = useSharedValue(false);
  const isQuoteStale = useSharedValue(0); // TODO: Convert this to a boolean
  const isSwapping = useSharedValue(false);

  const lastTypedInput = useSharedValue<InputKeys>(initialValues.lastTypedInput);
  const focusedInput = useSharedValue<InputKeys>(initialValues.focusedInput);

  const internalSelectedInputAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(initialValues.inputAsset);
  const internalSelectedOutputAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(initialValues.outputAsset);

  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);
  const sliderXPosition = useSharedValue(
    getInitialSliderXPosition({
      inputAmount: initialValues.inputAmount,
      maxSwappableAmount: initialValues.inputAsset?.maxSwappableAmount,
      percentageToSell: initialValues.percentageToSell,
    })
  );

  const hasEnoughFundsForGas = useSharedValue<boolean | undefined>(undefined);
  const gasPanelHeight = useSharedValue(0);
  const quote = useSharedValue<Quote | CrosschainQuote | QuoteError | null>(null);
  const selectedOutputChainId = useSharedValue<ChainId>(initialValues.inputAsset?.chainId || ChainId.mainnet);
  const slippage = useSharedValue(initialValues.slippage);

  const configProgress = useSharedValue<NavigationSteps>(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const inputProgress = useSharedValue(
    initialValues.outputAsset && !initialValues.inputAsset ? NavigationSteps.TOKEN_LIST_FOCUSED : NavigationSteps.INPUT_ELEMENT_FOCUSED
  );
  const outputProgress = useSharedValue(
    initialValues.outputAsset ? NavigationSteps.INPUT_ELEMENT_FOCUSED : NavigationSteps.TOKEN_LIST_FOCUSED
  );

  const SwapInputController = useSwapInputsController({
    currentCurrency,
    focusedInput,
    initialValues,
    inputProgress,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
    isQuoteStale,
    lastTypedInput,
    outputProgress,
    quote,
    sliderXPosition,
  });

  const {
    debouncedFetchQuote,
    inputMethod,
    inputNativePrice,
    inputValues,
    outputNativePrice,
    percentageToSwap,
    quoteFetchingInterval,
    resetValuesToZeroWorklet,
  } = SwapInputController;

  const SwapSettings = useSwapSettings({
    debouncedFetchQuote,
    slippage,
  });

  const atomicSwapsEnabled = useExperimentalFlag(ATOMIC_SWAPS);
  const config = useRemoteConfig();

  const { degenMode } = SwapSettings;

  const getNonceAndPerformSwap = async ({
    type,
    parameters,
  }: {
    type: 'swap' | 'crosschainSwap';
    parameters: Omit<RapSwapActionParameters<typeof type>, 'gasParams' | 'gasFeeParamsBySpeed' | 'selectedGasFee'>;
  }) => {
    try {
      const degenMode = swapsStore.getState().degenMode;
      // const shouldDelegate =
      //   (atomicSwapsEnabled || config.atomic_swaps_enabled) &&
      //   (await getShouldDelegate(parameters.chainId, parameters.quote as Quote | CrosschainQuote, parameters.assetToSell));
      const shouldDelegate = await getShouldDelegate(
        parameters.chainId,
        parameters.quote as Quote | CrosschainQuote,
        parameters.assetToSell
      );
      const selectedGas = getSelectedGas(parameters.chainId);

      const connectedToAnvil = useConnectedToAnvilStore.getState().connectedToAnvil;
      const chainId = connectedToAnvil ? ChainId.anvil : parameters.chainId;
      const nonce = await getNextNonce({ address: parameters.quote.from, chainId });

      const NotificationManager = IS_IOS ? NativeModules.NotificationManager : null;

      if (!selectedGas) {
        isSwapping.value = false;
        Alert.alert(i18n.t(i18n.l.gas.unable_to_determine_selected_gas));
        return;
      }

      const gasFeeParamsBySpeed = getGasSettingsBySpeed(parameters.chainId);
      let gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
      if (selectedGas.isEIP1559) {
        gasParams = {
          maxFeePerGas: sumWorklet(selectedGas.maxBaseFee, selectedGas.maxPriorityFee),
          maxPriorityFeePerGas: selectedGas.maxPriorityFee,
        };
      } else {
        gasParams = { gasPrice: selectedGas.gasPrice };
      }

      NotificationManager?.postNotification('rapInProgress');

      let errorMessage: string | null;

      if (shouldDelegate) {
        const publicClient = getProviderViem({ chainId: parameters.chainId });
        const walletViem = await loadWalletViem({
          address: parameters.quote.from as `0x${string}`,
          publicClient: publicClient,
          timeTracking: {
            screen: Screens.SWAPS,
            operation: TimeToSignOperation.Authentication,
            metadata: { degenMode },
          },
        });
        if (!walletViem) {
          isSwapping.value = false;
          triggerHaptics('notificationError');
          showWalletErrorAlert();
          return;
        }
        const { error } = await walletExecuteWithDelegate({
          walletClient: walletViem,
          publicClient,
          type,
          parameters: { ...parameters, gasParams },
        });
        errorMessage = error;
      } else {
        const provider = getProvider({ chainId: parameters.chainId });
        const wallet = await performanceTracking.getState().executeFn({
          fn: loadWallet,
          screen: Screens.SWAPS,
          operation: TimeToSignOperation.KeychainRead,
          metadata: { degenMode },
        })({
          address: parameters.quote.from,
          showErrorIfNotLoaded: false,
          provider,
          timeTracking: {
            screen: Screens.SWAPS,
            operation: TimeToSignOperation.Authentication,
            metadata: { degenMode },
          },
        });
        if (!wallet) {
          isSwapping.value = false;
          triggerHaptics('notificationError');
          showWalletErrorAlert();
          return;
        }
        const { errorMessage: errorMessageFromWallet } = await performanceTracking.getState().executeFn({
          fn: walletExecuteRap,
          screen: Screens.SWAPS,
          operation: TimeToSignOperation.SignTransaction,
          metadata: { degenMode },
        })(wallet, type, {
          ...parameters,
          nonce,
          chainId,
          gasParams,
          gasFeeParamsBySpeed,
        });
        errorMessage = errorMessageFromWallet;
      }

      isSwapping.value = false;

      if (errorMessage) {
        runOnUI(() => {
          quoteFetchingInterval.start();
        })();

        trackSwapEvent(analytics.event.swapsFailed, {
          errorMessage,
          isHardwareWallet,
          parameters,
          quickBuyMetadata: initialValues.quickBuyMetadata,
          type,
        });

        if (errorMessage !== 'handled') {
          logger.error(new RainbowError(`[getNonceAndPerformSwap]: Error executing swap: ${errorMessage}`));
          const extractedError = errorMessage.split('[')[0];
          Alert.alert(i18n.t(i18n.l.swap.error_executing_swap), extractedError);
          return;
        }
      }

      const { addRecentSwap, outputAsset } = swapsStore.getState();
      if (outputAsset) addRecentSwap(outputAsset);

      clearCustomGasSettings(chainId);
      NotificationManager?.postNotification('rapCompleted');
      performanceTracking.getState().executeFn({
        fn: () => {
          if (initialValues.goBackOnSwapSubmit) {
            Navigation.goBack();
            return;
          }

          const navState = Navigation.getState();
          const activeRoute = Navigation.getActiveRoute();
          if (
            navState?.index === 0 ||
            navState?.routes[navState.index - 1].name === Routes.EXPANDED_ASSET_SHEET_V2 ||
            activeRoute?.name === Routes.PAIR_HARDWARE_WALLET_AGAIN_SHEET
          ) {
            Navigation.handleAction(Routes.WALLET_SCREEN);
          } else {
            Navigation.goBack();
          }
        },
        screen: Screens.SWAPS,
        operation: TimeToSignOperation.SheetDismissal,
        endOfOperation: true,
        metadata: { degenMode },
      })();

      trackSwapEvent(analytics.event.swapsSubmitted, {
        isHardwareWallet,
        parameters,
        quickBuyMetadata: initialValues.quickBuyMetadata,
        type,
      });
    } catch (error) {
      isSwapping.value = false;

      const message = error instanceof Error ? error.message : 'Generic error while trying to swap';
      logger.error(new RainbowError(`[getNonceAndPerformSwap]: ${message}`), {
        data: { error, parameters, type },
      });
    }

    // reset the last navigated trending token after a swap has taken place
    swapsStore.setState({ lastNavigatedTrendingToken: undefined });
  };

  const executeSwap = performanceTracking.getState().executeFn({
    screen: Screens.SWAPS,
    operation: TimeToSignOperation.CallToAction,
    fn: () => {
      'worklet';

      if (configProgress.value !== NavigationSteps.SHOW_REVIEW && !degenMode.value) return;

      const inputAsset = internalSelectedInputAsset.value;
      const outputAsset = internalSelectedOutputAsset.value;
      const quoteData = quote.value;

      if (isSwapping.value || !inputAsset || !outputAsset || !quoteData || 'error' in quoteData) {
        return;
      }

      isSwapping.value = true;
      quoteFetchingInterval.stop();

      const type = inputAsset.chainId !== outputAsset.chainId ? 'crosschainSwap' : 'swap';
      const isNativeWrapOrUnwrap = quoteData.swapType === SwapType.wrap || quoteData.swapType === SwapType.unwrap;

      const parameters: Omit<RapSwapActionParameters<typeof type>, 'gasParams' | 'gasFeeParamsBySpeed' | 'selectedGasFee'> = {
        sellAmount: quoteData.sellAmount?.toString(),
        buyAmount: quoteData.buyAmount?.toString(),
        chainId: inputAsset.chainId,
        assetToSell: inputAsset,
        assetToBuy: outputAsset,
        quote: {
          ...quoteData,
          buyAmountDisplay: isNativeWrapOrUnwrap ? quoteData.buyAmount : quoteData.buyAmountDisplay,
          sellAmountDisplay: isNativeWrapOrUnwrap ? quoteData.sellAmount : quoteData.sellAmountDisplay,
          feeInEth: isNativeWrapOrUnwrap ? '0' : quoteData.feeInEth,
        },
      };

      runOnJS(getNonceAndPerformSwap)({ type, parameters });
    },
    metadata: { degenMode: swapsStore.getState().degenMode },
  });

  const swapInfo = useDerivedValue(() => {
    const areAllInputsZero =
      equalWorklet(inputValues.value.inputAmount, '0') &&
      equalWorklet(inputValues.value.inputNativeValue, '0') &&
      equalWorklet(inputValues.value.outputAmount, '0') &&
      equalWorklet(inputValues.value.outputNativeValue, '0');

    const areBothAssetsSet = !!internalSelectedInputAsset.value && !!internalSelectedOutputAsset.value;
    const isBridging =
      !!internalSelectedInputAsset.value?.networks &&
      !!internalSelectedOutputAsset.value?.chainId &&
      internalSelectedInputAsset.value.networks[internalSelectedOutputAsset.value.chainId]?.address ===
        internalSelectedOutputAsset.value.address;

    return {
      areAllInputsZero,
      areBothAssetsSet,
      isBridging,
    };
  });

  const SwapTextStyles = useSwapTextStyles({
    inputMethod,
    inputValues,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
    isQuoteStale,
  });

  const SwapNavigation = useSwapNavigation({
    configProgress,
    executeSwap,
    inputProgress,
    isDegenMode: degenMode,
    outputProgress,
    quoteFetchingInterval,
    selectedInputAsset: internalSelectedInputAsset,
    selectedOutputAsset: internalSelectedOutputAsset,
    swapInfo,
  });

  const SwapWarning = useSwapWarning({
    inputAsset: internalSelectedInputAsset,
    inputNativePrice,
    inputValues,
    isFetching,
    isQuoteStale,
    outputAsset: internalSelectedOutputAsset,
    outputNativePrice,
    quote,
    swapInfo,
  });

  const { swapWarning } = SwapWarning;

  const AnimatedSwapStyles = useAnimatedSwapStyles({
    SwapWarning,
    configProgress,
    degenMode,
    gasPanelHeight,
    inputProgress,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
    outputProgress,
    swapInfo,
  });

  const outputQuotesAreDisabled = useSwapOutputQuotesDisabled({
    inputAsset: internalSelectedInputAsset,
    outputAsset: internalSelectedOutputAsset,
  });

  const handleProgressNavigation = useCallback(
    ({ type }: { type: SwapAssetType }) => {
      'worklet';
      const inputAsset = internalSelectedInputAsset.value;
      const outputAsset = internalSelectedOutputAsset.value;

      switch (type) {
        case SwapAssetType.inputAsset:
          // if there is already an output asset selected, just close both lists
          if (outputAsset) {
            inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
            outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
          } else {
            inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
            outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
            SwapNavigation.handleDismissSettings({ skipAssetChecks: true });
          }
          break;
        case SwapAssetType.outputAsset:
          // if there is already an input asset selected, just close both lists
          if (inputAsset) {
            inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
            outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
          } else {
            inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
            outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
            SwapNavigation.handleDismissSettings({ skipAssetChecks: true });
          }
          break;
      }
    },
    [SwapNavigation, internalSelectedInputAsset, internalSelectedOutputAsset, inputProgress, outputProgress]
  );

  const setSelectedOutputChainId = (chainId: ChainId) => {
    const updateChainId = (chainId: ChainId) => {
      'worklet';
      selectedOutputChainId.value = chainId;
    };

    runOnUI(updateChainId)(chainId);
    swapsStore.setState({ selectedOutputChainId: chainId });
  };

  const updateAssetValue = useCallback(
    ({ type, asset }: { type: SwapAssetType; asset: ExtendedAnimatedAssetWithColors | null }) => {
      'worklet';

      switch (type) {
        case SwapAssetType.inputAsset:
          internalSelectedInputAsset.value = asset;
          break;
        case SwapAssetType.outputAsset:
          internalSelectedOutputAsset.value = asset;
          break;
      }
    },
    [internalSelectedInputAsset, internalSelectedOutputAsset]
  );

  const updateInputValues = useCallback(
    ({
      didFlipAssets,
      didInputAssetChange,
      didOutputAssetChange,
    }: {
      didFlipAssets: boolean;
      didInputAssetChange: boolean;
      didOutputAssetChange: boolean;
    }) => {
      'worklet';
      if (didFlipAssets || (!didInputAssetChange && !didOutputAssetChange)) return;

      inputMethod.value = 'inputAmount';

      const balance = internalSelectedInputAsset.value?.maxSwappableAmount;

      // Handle the case where there is no input balance
      if (!balance || equalWorklet(balance, 0)) {
        resetValuesToZeroWorklet({ updateSlider: true });
        return;
      }

      if (didInputAssetChange) {
        sliderXPosition.value = withSpring(SLIDER_WIDTH / 2, snappySpringConfig);
      }

      const { inputAmount, inputNativeValue } = getInputValuesForSliderPositionWorklet({
        inputNativePrice: inputNativePrice.value,
        percentageToSwap: didInputAssetChange ? INITIAL_SLIDER_POSITION : percentageToSwap.value,
        selectedInputAsset: internalSelectedInputAsset.value,
        sliderXPosition: didInputAssetChange ? SLIDER_WIDTH * INITIAL_SLIDER_POSITION : sliderXPosition.value,
      });

      inputValues.modify(values => ({
        ...values,
        inputAmount,
        inputNativeValue,
      }));
    },
    [inputMethod, inputNativePrice, internalSelectedInputAsset, inputValues, percentageToSwap, resetValuesToZeroWorklet, sliderXPosition]
  );

  const chainSetTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const setAsset = useCallback(
    ({
      asset,
      didWalletChange = false,
      insertUserAssetBalance = false,
      type,
    }: {
      asset: ParsedSearchAsset | null;
      didWalletChange?: boolean;
      insertUserAssetBalance?: boolean;
      type: SwapAssetType;
    }) => {
      const extendedAsset = parseAssetAndExtend({ asset, insertUserAssetBalance: insertUserAssetBalance || didWalletChange });
      const isSettingInputAsset = type === SwapAssetType.inputAsset;

      let otherAssetBalance: ParsedUserAsset['balance'] | undefined = undefined;
      let otherAssetUniqueId: ParsedUserAsset['uniqueId'] | undefined = undefined;

      if (didWalletChange) {
        const oppositeAssetBalance = getOppositeAssetBalance(extendedAsset, type);
        otherAssetBalance = oppositeAssetBalance.otherAssetBalance;
        otherAssetUniqueId = oppositeAssetBalance.otherAssetUniqueId;
      }

      runOnUI(() => {
        const otherSelectedAsset = (isSettingInputAsset ? internalSelectedOutputAsset : internalSelectedInputAsset).value;
        const didSelectedAssetChange =
          didWalletChange ||
          (isSettingInputAsset
            ? internalSelectedInputAsset.value?.uniqueId !== extendedAsset?.uniqueId
            : internalSelectedOutputAsset.value?.uniqueId !== extendedAsset?.uniqueId);

        const didInputAssetChange = didSelectedAssetChange && isSettingInputAsset;
        const didOutputAssetChange = didSelectedAssetChange && !isSettingInputAsset;
        const [currentInputChainId, previousInputChainId] = didInputAssetChange
          ? [extendedAsset?.chainId, internalSelectedInputAsset.value?.chainId]
          : [];

        let flippedAssetOrNull: ExtendedAnimatedAssetWithColors | null = null;
        let didFlipAssets = false;

        if (didSelectedAssetChange) {
          didFlipAssets = !!(otherSelectedAsset && otherSelectedAsset.uniqueId === extendedAsset?.uniqueId);

          if (didFlipAssets) {
            const inputPrice = outputNativePrice.value;
            const outputPrice = inputNativePrice.value;

            flippedAssetOrNull = (isSettingInputAsset ? internalSelectedInputAsset : internalSelectedOutputAsset).value;

            if (otherAssetBalance && flippedAssetOrNull && otherAssetUniqueId === flippedAssetOrNull.uniqueId) {
              flippedAssetOrNull = {
                ...flippedAssetOrNull,
                balance: otherAssetBalance,
                maxSwappableAmount: trimTrailingZeros(otherAssetBalance.amount),
              };
            }

            updateAssetValue({
              asset: flippedAssetOrNull,
              type: isSettingInputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset,
            });

            updateAssetValue({ asset: extendedAsset, type });

            updateInputValuesAfterFlip({
              areAllInputsZero: swapInfo.value.areAllInputsZero,
              currency: currentCurrency,
              inputMethod,
              inputNativePrice: inputPrice,
              inputValues,
              internalSelectedInputAsset,
              internalSelectedOutputAsset,
              lastTypedInput: lastTypedInput.value,
              outputNativePrice: outputPrice,
              resetValuesToZeroWorklet,
              sliderXPosition,
            });
          } else {
            updateAssetValue({ type, asset: extendedAsset });

            if (otherAssetBalance && otherSelectedAsset) {
              const assetToUpdate = isSettingInputAsset ? internalSelectedOutputAsset : internalSelectedInputAsset;
              assetToUpdate.modify(asset =>
                !asset || otherAssetUniqueId !== otherSelectedAsset.uniqueId
                  ? asset
                  : { ...asset, balance: otherAssetBalance, maxSwappableAmount: trimTrailingZeros(otherAssetBalance.amount) }
              );
            }
          }
        } else if (!swapInfo.value.areAllInputsZero && swapInfo.value.areBothAssetsSet) {
          quoteFetchingInterval.start();
        }

        let newSlippage: string | undefined;
        if (didInputAssetChange && currentInputChainId !== previousInputChainId) {
          const previousDefaultSlippage = getDefaultSlippageWorklet(previousInputChainId || ChainId.mainnet, SLIPPAGE_CONFIG);

          // If the user has not overridden the default slippage, update it
          if (slippage.value === previousDefaultSlippage) {
            newSlippage = getDefaultSlippageWorklet(currentInputChainId || ChainId.mainnet, SLIPPAGE_CONFIG);
            slippage.value = newSlippage;
          }
        }

        updateInputValues({ didFlipAssets, didInputAssetChange, didOutputAssetChange });

        const swapsStoreUpdate = {
          asset: extendedAsset,
          didFlipAssets,
          didSelectedAssetChange,
          insertUserAssetBalance: !isSettingInputAsset,
          flippedAssetOrNull,
          newSlippage,
          otherSelectedAsset,
          type,
        };

        runOnJS(setStoreAssets)(swapsStoreUpdate);
      })();

      if (chainSetTimeoutId.current) {
        clearTimeout(chainSetTimeoutId.current);
      }

      if (isSettingInputAsset) {
        // This causes a heavy re-render in the output token list, so we delay updating the selected output chain until
        // the animation is most likely complete.
        chainSetTimeoutId.current = setTimeout(() => {
          InteractionManager.runAfterInteractions(() => {
            const chainIdToSet = extendedAsset?.chainId ?? ChainId.mainnet;
            const shouldUpdateSelectedOutputChainId = swapsStore.getState().selectedOutputChainId !== chainIdToSet;
            if (shouldUpdateSelectedOutputChainId) swapsStore.setState({ selectedOutputChainId: chainIdToSet });

            runOnUI(() => {
              if (selectedOutputChainId.value !== chainIdToSet) {
                selectedOutputChainId.value = chainIdToSet;
              }
            })();
          });
        }, 750);
      }

      runOnUI(handleProgressNavigation)({ type });
    },
    [
      currentCurrency,
      handleProgressNavigation,
      inputMethod,
      inputNativePrice,
      inputValues,
      internalSelectedInputAsset,
      internalSelectedOutputAsset,
      lastTypedInput,
      outputNativePrice,
      quoteFetchingInterval,
      resetValuesToZeroWorklet,
      selectedOutputChainId,
      sliderXPosition,
      slippage,
      swapInfo,
      updateAssetValue,
      updateInputValues,
    ]
  );

  useEffect(() => {
    return () => {
      if (chainSetTimeoutId.current) {
        // Clear the timeout on unmount
        clearTimeout(chainSetTimeoutId.current);
      }
    };
  }, []);

  // Stop auto-fetching if there is a quote error or no input asset balance
  useAnimatedReaction(
    () =>
      swapWarning.value.type === SwapWarningType.no_quote_available ||
      swapWarning.value.type === SwapWarningType.no_route_found ||
      !swapInfo.value.areBothAssetsSet ||
      swapInfo.value.areAllInputsZero,
    (shouldStop, previous) => {
      if (shouldStop && !previous) {
        quoteFetchingInterval.stop();
      }
    },
    []
  );

  const confirmButtonProps = useDerivedValue<ConfirmButtonProps>(() => {
    if (isSwapping.value) {
      return { label: swapping, disabled: true, type: 'hold' };
    }

    if (configProgress.value === NavigationSteps.SHOW_GAS) {
      return { label: done, disabled: false, type: 'tap' };
    }

    if (configProgress.value === NavigationSteps.SHOW_SETTINGS) {
      return { label: done, disabled: false, type: 'tap' };
    }

    const hasSelectedAssets = internalSelectedInputAsset.value && internalSelectedOutputAsset.value;
    if (!hasSelectedAssets) {
      return { label: selectToken, disabled: true, type: 'hold' };
    }

    const sellAsset = internalSelectedInputAsset.value;
    const enoughFundsForSwap =
      sellAsset &&
      !equalWorklet(sellAsset.maxSwappableAmount, '0') &&
      lessThanOrEqualToWorklet(inputValues.value.inputAmount, sellAsset.maxSwappableAmount);

    if (!enoughFundsForSwap && hasEnoughFundsForGas.value !== undefined) {
      return { label: insufficientFunds, disabled: true, type: 'hold' };
    }

    const isInputZero = equalWorklet(inputValues.value.inputAmount, 0);
    const isOutputZero = equalWorklet(inputValues.value.outputAmount, 0);
    const currentInputMethod = inputMethod.value;

    const userHasNotEnteredAmount = currentInputMethod !== 'slider' && isInputZero && isOutputZero;
    const userHasNotMovedSlider = currentInputMethod === 'slider' && percentageToSwap.value === 0;

    if (userHasNotEnteredAmount || userHasNotMovedSlider) {
      return { label: enterAmount, disabled: true, opacity: 1, type: 'hold' };
    }

    const holdLabel = swapInfo.value.isBridging ? holdToBridge : holdToSwap;
    const reviewLabel = degenMode.value ? holdLabel : review;

    const isQuoteError = quote.value && 'error' in quote.value;
    const isLoadingGas = !isQuoteError && hasEnoughFundsForGas.value === undefined;
    const isReviewSheetOpen = configProgress.value === NavigationSteps.SHOW_REVIEW || degenMode.value;

    const isStale =
      !!isQuoteStale.value && (currentInputMethod !== 'slider' || sliderPressProgress.value === SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);

    if ((isFetching.value || isLoadingGas || isStale) && !isQuoteError) {
      const disabled = (isReviewSheetOpen && (isFetching.value || isLoadingGas || isStale)) || !quote.value;
      const buttonType = isReviewSheetOpen ? 'hold' : 'tap';
      return { label: fetchingPrices, disabled, type: buttonType };
    }

    const quoteUnavailable = [
      SwapWarningType.no_quote_available,
      SwapWarningType.no_route_found,
      SwapWarningType.insufficient_liquidity,
    ].includes(swapWarning.value.type);

    if (quoteUnavailable || isQuoteError) {
      const icon = isReviewSheetOpen ? undefined : '􀕹';
      return { icon, label: isReviewSheetOpen ? quoteError : reviewLabel, disabled: true, type: 'hold' };
    }

    if (hasEnoughFundsForGas.value === false) {
      const nativeCurrency = nativeChainAssets[sellAsset?.chainId || ChainId.mainnet];
      return {
        label: `${insufficient} ${nativeCurrency.symbol}`,
        disabled: true,
        type: 'hold',
      };
    }

    if (isReviewSheetOpen) {
      const isDraggingSlider = !!isQuoteStale.value && sliderPressProgress.value !== SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT;
      return { icon: '􀎽', label: holdLabel, disabled: isDraggingSlider, type: 'hold' };
    }

    return { icon: '􀕹', label: reviewLabel, disabled: false, type: 'tap' };
  });

  const confirmButtonIconStyle = useAnimatedStyle(() => {
    const shouldHide = !confirmButtonProps.value.icon;
    return {
      display: shouldHide ? 'none' : 'flex',
    };
  });

  return (
    <SwapContext.Provider
      value={{
        isFetching,
        isSwapping,
        isQuoteStale,

        inputSearchRef,
        outputSearchRef,

        inputProgress,
        outputProgress,
        configProgress,

        sliderXPosition,
        sliderPressProgress,

        lastTypedInput,
        focusedInput,

        selectedOutputChainId,
        setSelectedOutputChainId,

        handleProgressNavigation,
        internalSelectedInputAsset,
        internalSelectedOutputAsset,
        setAsset,

        quote,
        outputQuotesAreDisabled,
        swapInfo,
        executeSwap,
        quoteFetchingInterval: quoteFetchingInterval,

        SwapSettings,
        SwapInputController,
        AnimatedSwapStyles,
        SwapTextStyles,
        SwapNavigation,
        SwapWarning,

        confirmButtonProps,
        confirmButtonIconStyle,

        hasEnoughFundsForGas,
        gasPanelHeight,
      }}
    >
      {children}
      <SyncQuoteSharedValuesToState />
      <SyncGasStateToSharedValues />
    </SwapContext.Provider>
  );
};

function getOppositeAssetBalance(
  extendedAsset: ExtendedAnimatedAssetWithColors | null,
  type: SwapAssetType
): {
  otherAssetBalance: ExtendedAnimatedAssetWithColors['balance'] | undefined;
  otherAssetUniqueId: ExtendedAnimatedAssetWithColors['uniqueId'] | undefined;
} {
  const isSettingInputAsset = type === SwapAssetType.inputAsset;
  const { inputAsset, outputAsset } = swapsStore.getState();

  let otherAssetBalance: ExtendedAnimatedAssetWithColors['balance'] | undefined = undefined;
  let otherAssetUniqueId = isSettingInputAsset ? outputAsset?.uniqueId : inputAsset?.uniqueId;

  const isFlipping = otherAssetUniqueId === extendedAsset?.uniqueId;
  if (isFlipping) otherAssetUniqueId = (isSettingInputAsset ? inputAsset : outputAsset)?.uniqueId;

  const { balance: updatedAssetBalance, symbol: otherAssetSymbol }: Partial<ExtendedAnimatedAssetWithColors> =
    (otherAssetUniqueId && useUserAssetsStore.getState().getUserAsset(otherAssetUniqueId)) || {};

  if (updatedAssetBalance) otherAssetBalance = updatedAssetBalance;
  else otherAssetBalance = { amount: '0', display: `0 ${otherAssetSymbol}` };

  return { otherAssetBalance, otherAssetUniqueId };
}

function setStoreAssets({
  asset,
  didFlipAssets,
  didSelectedAssetChange,
  insertUserAssetBalance,
  flippedAssetOrNull,
  newSlippage,
  otherSelectedAsset,
  type,
}: {
  asset: ExtendedAnimatedAssetWithColors | null;
  didFlipAssets: boolean;
  didSelectedAssetChange: boolean;
  insertUserAssetBalance: boolean;
  flippedAssetOrNull: ExtendedAnimatedAssetWithColors | null;
  newSlippage: string | undefined;
  otherSelectedAsset: ExtendedAnimatedAssetWithColors | null;
  type: SwapAssetType;
}) {
  if (didSelectedAssetChange) {
    const assetToSet = insertUserAssetBalance
      ? {
          ...asset,
          balance: (asset && useUserAssetsStore.getState().getUserAsset(asset.uniqueId)?.balance) || asset?.balance,
        }
      : asset;

    if (didFlipAssets) {
      swapsStore.setState({
        [type === SwapAssetType.inputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset]: flippedAssetOrNull,
        [type]: otherSelectedAsset,
        ...(newSlippage && { slippage: newSlippage }),
      });
    } else {
      swapsStore.setState({ [type]: assetToSet, ...(newSlippage && { slippage: newSlippage }) });
    }
  }

  analytics.track(analytics.event.swapsSelectedAsset, {
    asset,
    otherAsset: otherSelectedAsset,
    type,
  });
}

export const useSwapContext = () => {
  const context = useContext(SwapContext);
  if (context === undefined) {
    throw new Error('useSwapContext must be used within a SwapProvider');
  }
  return context;
};

export { NavigationSteps };
