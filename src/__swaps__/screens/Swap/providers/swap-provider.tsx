// @refresh
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';
import { InteractionManager, NativeModules, StyleProp, TextInput, TextStyle } from 'react-native';
import {
  AnimatedRef,
  DerivedValue,
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import { divWorklet, equalWorklet, lessThanOrEqualToWorklet, mulWorklet, sumWorklet } from '@/safe-math/SafeMath';
import { SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useAnimatedSwapStyles } from '@/__swaps__/screens/Swap/hooks/useAnimatedSwapStyles';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { NavigationSteps, useSwapNavigation } from '@/__swaps__/screens/Swap/hooks/useSwapNavigation';
import { useSwapSettings } from '@/__swaps__/screens/Swap/hooks/useSwapSettings';
import { useSwapTextStyles } from '@/__swaps__/screens/Swap/hooks/useSwapTextStyles';
import { SwapWarningType, useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { userAssetsQueryKey } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import { AddressOrEth, ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { SwapAssetType, inputKeys } from '@/__swaps__/types/swap';
import { clamp, getDefaultSlippageWorklet, parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { analyticsV2 } from '@/analytics';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { getProvider } from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { useAccountSettings } from '@/hooks';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { walletExecuteRap } from '@/raps/execute';
import { QuoteTypeMap, RapSwapActionParameters } from '@/raps/references';
import { queryClient } from '@/react-query';
import { userAssetsStore } from '@/state/assets/userAssets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { getNextNonce } from '@/state/nonces';

import { haptics } from '@/utils';
import { CrosschainQuote, Quote, QuoteError, SwapType } from '@rainbow-me/swaps';

import { IS_IOS } from '@/env';
import { Address } from 'viem';
import { clearCustomGasSettings } from '../hooks/useCustomGas';
import { getGasSettingsBySpeed, getSelectedGas } from '../hooks/useSelectedGas';
import { useSwapOutputQuotesDisabled } from '../hooks/useSwapOutputQuotesDisabled';
import { SyncGasStateToSharedValues, SyncQuoteSharedValuesToState } from './SyncSwapStateAndSharedValues';
import { performanceTracking, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { getRemoteConfig } from '@/model/remoteConfig';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { useBackendNetworksStore, getChainsNativeAssetWorklet } from '@/state/backendNetworks/backendNetworks';
import { getSwapsNavigationParams } from '../navigateToSwaps';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import showWalletErrorAlert from '@/helpers/support';

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

  // TODO: Combine navigation progress steps into a single shared value
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  configProgress: SharedValue<NavigationSteps>;

  sliderXPosition: SharedValue<number>;
  sliderPressProgress: SharedValue<number>;

  lastTypedInput: SharedValue<inputKeys>;
  focusedInput: SharedValue<inputKeys>;

  selectedOutputChainId: SharedValue<ChainId>;
  setSelectedOutputChainId: (chainId: ChainId) => void;

  handleProgressNavigation: ({ type }: { type: SwapAssetType }) => void;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  setAsset: ({ type, asset }: { type: SwapAssetType; asset: ParsedSearchAsset | null }) => void;

  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  executeSwap: () => void;
  quoteFetchingInterval: ReturnType<typeof useAnimatedInterval>;

  outputQuotesAreDisabled: DerivedValue<boolean>;
  swapInfo: DerivedValue<{
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
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

interface SwapProviderProps {
  children: ReactNode;
}

const getInitialSliderXPosition = ({
  inputAmount,
  maxSwappableAmount,
}: {
  inputAmount: string | undefined;
  maxSwappableAmount: string | undefined;
}) => {
  if (inputAmount && maxSwappableAmount) {
    return clamp(+mulWorklet(divWorklet(inputAmount, maxSwappableAmount), SLIDER_WIDTH), 0, SLIDER_WIDTH);
  }
  return SLIDER_WIDTH * swapsStore.getState().percentageToSell;
};

export const SwapProvider = ({ children }: SwapProviderProps) => {
  const { nativeCurrency } = useAccountSettings();

  const backendNetworks = useBackendNetworksStore(state => state.backendNetworksSharedValue);
  const initialValues = getSwapsNavigationParams();

  const isFetching = useSharedValue(false);
  const isQuoteStale = useSharedValue(0); // TODO: Convert this to a boolean
  const isSwapping = useSharedValue(false);

  const inputSearchRef = useAnimatedRef<TextInput>();
  const outputSearchRef = useAnimatedRef<TextInput>();

  const lastTypedInput = useSharedValue<inputKeys>(initialValues.lastTypedInput);
  const focusedInput = useSharedValue<inputKeys>(initialValues.focusedInput);

  const initialSelectedInputAsset = parseAssetAndExtend({ asset: initialValues.inputAsset });
  const initialSelectedOutputAsset = parseAssetAndExtend({ asset: initialValues.outputAsset });

  const internalSelectedInputAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(initialSelectedInputAsset);
  const internalSelectedOutputAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(initialSelectedOutputAsset);

  const sliderXPosition = useSharedValue(
    getInitialSliderXPosition({
      inputAmount: initialValues.inputAmount,
      maxSwappableAmount: initialSelectedInputAsset?.maxSwappableAmount,
    })
  );
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);

  const selectedOutputChainId = useSharedValue<ChainId>(initialSelectedInputAsset?.chainId || ChainId.mainnet);
  const quote = useSharedValue<Quote | CrosschainQuote | QuoteError | null>(null);
  const inputProgress = useSharedValue(
    initialSelectedOutputAsset && !initialSelectedInputAsset ? NavigationSteps.TOKEN_LIST_FOCUSED : NavigationSteps.INPUT_ELEMENT_FOCUSED
  );
  const outputProgress = useSharedValue(
    initialSelectedOutputAsset ? NavigationSteps.INPUT_ELEMENT_FOCUSED : NavigationSteps.TOKEN_LIST_FOCUSED
  );
  const configProgress = useSharedValue<NavigationSteps>(NavigationSteps.INPUT_ELEMENT_FOCUSED);

  const slippage = useSharedValue(getDefaultSlippageWorklet(initialSelectedInputAsset?.chainId || ChainId.mainnet, getRemoteConfig()));

  const hasEnoughFundsForGas = useSharedValue<boolean | undefined>(undefined);

  const SwapInputController = useSwapInputsController({
    focusedInput,
    lastTypedInput,
    inputProgress,
    outputProgress,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
    isQuoteStale,
    sliderXPosition,
    slippage,
    quote,
    initialValues,
  });

  const SwapSettings = useSwapSettings({
    debouncedFetchQuote: SwapInputController.debouncedFetchQuote,
    slippage,
  });

  const getNonceAndPerformSwap = async ({
    type,
    parameters,
  }: {
    type: 'swap' | 'crosschainSwap';
    parameters: Omit<RapSwapActionParameters<typeof type>, 'gasParams' | 'gasFeeParamsBySpeed' | 'selectedGasFee'>;
  }) => {
    try {
      const NotificationManager = IS_IOS ? NativeModules.NotificationManager : null;
      NotificationManager?.postNotification('rapInProgress');

      const provider = getProvider({ chainId: parameters.chainId });
      const connectedToAnvil = useConnectedToAnvilStore.getState().connectedToAnvil;

      const isBridge = swapsStore.getState().inputAsset?.mainnetAddress === swapsStore.getState().outputAsset?.mainnetAddress;
      const isDegenModeEnabled = swapsStore.getState().degenMode;
      const isSwappingToPopularAsset = swapsStore.getState().outputAsset?.sectionId === 'popular';
      const lastNavigatedTrendingToken = swapsStore.getState().lastNavigatedTrendingToken;
      const isSwappingToTrendingAsset =
        lastNavigatedTrendingToken === parameters.assetToBuy.uniqueId || lastNavigatedTrendingToken === parameters.assetToSell.uniqueId;

      const selectedGas = getSelectedGas(parameters.chainId);
      if (!selectedGas) {
        isSwapping.value = false;
        Alert.alert(i18n.t(i18n.l.gas.unable_to_determine_selected_gas));
        return;
      }

      const wallet = await performanceTracking.getState().executeFn({
        fn: loadWallet,
        screen: Screens.SWAPS,
        operation: TimeToSignOperation.KeychainRead,
        metadata: {
          degenMode: isDegenModeEnabled,
        },
      })({
        address: parameters.quote.from,
        showErrorIfNotLoaded: false,
        provider,
        timeTracking: {
          screen: Screens.SWAPS,
          operation: TimeToSignOperation.Authentication,
          metadata: {
            degenMode: isDegenModeEnabled,
          },
        },
      });
      const isHardwareWallet = wallet instanceof LedgerSigner;

      if (!wallet) {
        isSwapping.value = false;
        haptics.notificationError();
        showWalletErrorAlert();
        return;
      }

      const gasFeeParamsBySpeed = getGasSettingsBySpeed(parameters.chainId);

      let gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = {} as
        | TransactionGasParamAmounts
        | LegacyTransactionGasParamAmounts;

      if (selectedGas.isEIP1559) {
        gasParams = {
          maxFeePerGas: sumWorklet(selectedGas.maxBaseFee, selectedGas.maxPriorityFee),
          maxPriorityFeePerGas: selectedGas.maxPriorityFee,
        };
      } else {
        gasParams = {
          gasPrice: selectedGas.gasPrice,
        };
      }

      const chainId = connectedToAnvil ? ChainId.anvil : parameters.chainId;
      const nonce = await getNextNonce({ address: parameters.quote.from, chainId });

      const { errorMessage } = await performanceTracking.getState().executeFn({
        fn: walletExecuteRap,
        screen: Screens.SWAPS,
        operation: TimeToSignOperation.SignTransaction,
        metadata: {
          degenMode: isDegenModeEnabled,
        },
      })(wallet, type, {
        ...parameters,
        nonce,
        chainId,
        gasParams,
        // @ts-expect-error - collision between old gas types and new
        gasFeeParamsBySpeed: gasFeeParamsBySpeed,
      });
      isSwapping.value = false;

      if (errorMessage) {
        SwapInputController.quoteFetchingInterval.start();

        analyticsV2.track(analyticsV2.event.swapsFailed, {
          type,
          isBridge: isBridge,
          inputAssetSymbol: internalSelectedInputAsset.value?.symbol || '',
          inputAssetName: internalSelectedInputAsset.value?.name || '',
          inputAssetAddress: internalSelectedInputAsset.value?.address as AddressOrEth,
          inputAssetChainId: internalSelectedInputAsset.value?.chainId || ChainId.mainnet,
          inputAssetAmount: parameters.quote.sellAmount as number,
          outputAssetSymbol: internalSelectedOutputAsset.value?.symbol || '',
          outputAssetName: internalSelectedOutputAsset.value?.name || '',
          outputAssetAddress: internalSelectedOutputAsset.value?.address as AddressOrEth,
          outputAssetChainId: internalSelectedOutputAsset.value?.chainId || ChainId.mainnet,
          outputAssetAmount: parameters.quote.buyAmount as number,
          mainnetAddress: (parameters.assetToBuy.chainId === ChainId.mainnet
            ? parameters.assetToBuy.address
            : parameters.assetToSell.mainnetAddress) as AddressOrEth,
          tradeAmountUSD: parameters.quote.tradeAmountUSD,
          degenMode: isDegenModeEnabled,
          isSwappingToPopularAsset,
          isSwappingToTrendingAsset,
          errorMessage,
          isHardwareWallet,
        });

        if (errorMessage !== 'handled') {
          logger.error(new RainbowError(`[getNonceAndPerformSwap]: Error executing swap: ${errorMessage}`));
          const extractedError = errorMessage.split('[')[0];
          Alert.alert(i18n.t(i18n.l.swap.error_executing_swap), extractedError);
          return;
        }
      }

      queryClient.invalidateQueries(
        userAssetsQueryKey({
          address: parameters.quote.from,
          currency: nativeCurrency,
          testnetMode: connectedToAnvil,
        })
      );

      swapsStore.getState().addRecentSwap(parameters.assetToBuy as ExtendedAnimatedAssetWithColors);
      clearCustomGasSettings(chainId);
      NotificationManager?.postNotification('rapCompleted');
      performanceTracking.getState().executeFn({
        fn: () => {
          const { routes, index } = Navigation.getState();
          const activeRoute = Navigation.getActiveRoute();
          if (
            index === 0 ||
            routes[index - 1].name === Routes.EXPANDED_ASSET_SHEET ||
            activeRoute.name === Routes.PAIR_HARDWARE_WALLET_AGAIN_SHEET
          ) {
            Navigation.handleAction(Routes.WALLET_SCREEN, {});
          } else {
            Navigation.goBack();
          }
        },
        screen: Screens.SWAPS,
        operation: TimeToSignOperation.SheetDismissal,
        endOfOperation: true,
        metadata: {
          degenMode: isDegenModeEnabled,
        },
      })();

      analyticsV2.track(analyticsV2.event.swapsSubmitted, {
        type,
        isBridge: isBridge,
        inputAssetSymbol: internalSelectedInputAsset.value?.symbol || '',
        inputAssetName: internalSelectedInputAsset.value?.name || '',
        inputAssetAddress: internalSelectedInputAsset.value?.address as AddressOrEth,
        inputAssetChainId: internalSelectedInputAsset.value?.chainId || ChainId.mainnet,
        inputAssetAmount: parameters.quote.sellAmount as number,
        outputAssetSymbol: internalSelectedOutputAsset.value?.symbol || '',
        outputAssetName: internalSelectedOutputAsset.value?.name || '',
        outputAssetAddress: internalSelectedOutputAsset.value?.address as AddressOrEth,
        outputAssetChainId: internalSelectedOutputAsset.value?.chainId || ChainId.mainnet,
        outputAssetAmount: parameters.quote.buyAmount as number,
        mainnetAddress: (parameters.assetToBuy.chainId === ChainId.mainnet
          ? parameters.assetToBuy.address
          : parameters.assetToSell.mainnetAddress) as AddressOrEth,
        tradeAmountUSD: parameters.quote.tradeAmountUSD,
        degenMode: isDegenModeEnabled,
        isSwappingToPopularAsset,
        isSwappingToTrendingAsset,
        isHardwareWallet,
      });
    } catch (error) {
      isSwapping.value = false;

      const message = error instanceof Error ? error.message : 'Generic error while trying to swap';
      logger.error(new RainbowError(`[getNonceAndPerformSwap]: ${message}`), {
        data: {
          error,
          type,
          parameters,
        },
      });
    }

    // reset the last navigated trending token after a swap has taken place
    swapsStore.setState({
      lastNavigatedTrendingToken: undefined,
    });
  };

  const executeSwap = performanceTracking.getState().executeFn({
    screen: Screens.SWAPS,
    operation: TimeToSignOperation.CallToAction,
    fn: () => {
      'worklet';

      if (configProgress.value !== NavigationSteps.SHOW_REVIEW && !SwapSettings.degenMode.value) return;

      const inputAsset = internalSelectedInputAsset.value;
      const outputAsset = internalSelectedOutputAsset.value;
      const q = quote.value;

      // TODO: What other checks do we need here?
      if (isSwapping.value || !inputAsset || !outputAsset || !q || (q as QuoteError)?.error) {
        return;
      }

      isSwapping.value = true;
      SwapInputController.quoteFetchingInterval.stop();

      const type = inputAsset.chainId !== outputAsset.chainId ? 'crosschainSwap' : 'swap';
      const quoteData = q as QuoteTypeMap[typeof type];
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

      runOnJS(getNonceAndPerformSwap)({
        type,
        parameters,
      });
    },
    metadata: {
      degenMode: swapsStore.getState().degenMode,
    },
  });

  const swapInfo = useDerivedValue(() => {
    const areBothAssetsSet = !!internalSelectedInputAsset.value && !!internalSelectedOutputAsset.value;
    const isBridging =
      !!internalSelectedInputAsset.value?.networks &&
      !!internalSelectedOutputAsset.value?.chainId &&
      (internalSelectedInputAsset.value.networks[internalSelectedOutputAsset.value.chainId]?.address as unknown as AddressOrEth) ===
        internalSelectedOutputAsset.value.address;

    return {
      areBothAssetsSet,
      isBridging,
    };
  });

  const SwapTextStyles = useSwapTextStyles({
    inputMethod: SwapInputController.inputMethod,
    inputValues: SwapInputController.inputValues,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
    isQuoteStale,
  });

  const SwapNavigation = useSwapNavigation({
    configProgress,
    executeSwap,
    inputProgress,
    isDegenMode: SwapSettings.degenMode,
    outputProgress,
    quoteFetchingInterval: SwapInputController.quoteFetchingInterval,
    selectedInputAsset: internalSelectedInputAsset,
    selectedOutputAsset: internalSelectedOutputAsset,
    swapInfo,
  });

  const SwapWarning = useSwapWarning({
    inputAsset: internalSelectedInputAsset,
    inputValues: SwapInputController.inputValues,
    outputAsset: internalSelectedOutputAsset,
    quote,
    isFetching,
    isQuoteStale,
  });

  const AnimatedSwapStyles = useAnimatedSwapStyles({
    SwapWarning,
    configProgress,
    degenMode: SwapSettings.degenMode,
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

  const chainSetTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const setAsset = useCallback(
    ({ type, asset }: { type: SwapAssetType; asset: ParsedSearchAsset | null }) => {
      const insertUserAssetBalance = type !== SwapAssetType.inputAsset;
      const extendedAsset = parseAssetAndExtend({ asset, insertUserAssetBalance });

      const otherSelectedAsset = type === SwapAssetType.inputAsset ? internalSelectedOutputAsset.value : internalSelectedInputAsset.value;
      const isSameAsOtherAsset = !!(otherSelectedAsset && otherSelectedAsset.uniqueId === extendedAsset?.uniqueId);
      const flippedAssetOrNull =
        (isSameAsOtherAsset &&
          (type === SwapAssetType.inputAsset ? internalSelectedInputAsset.value : internalSelectedOutputAsset.value)) ||
        null;

      const didSelectedAssetChange =
        type === SwapAssetType.inputAsset
          ? internalSelectedInputAsset.value?.uniqueId !== extendedAsset?.uniqueId
          : internalSelectedOutputAsset.value?.uniqueId !== extendedAsset?.uniqueId;

      runOnUI(() => {
        const didSelectedAssetChange =
          type === SwapAssetType.inputAsset
            ? internalSelectedInputAsset.value?.uniqueId !== extendedAsset?.uniqueId
            : internalSelectedOutputAsset.value?.uniqueId !== extendedAsset?.uniqueId;

        if (didSelectedAssetChange) {
          const otherSelectedAsset =
            type === SwapAssetType.inputAsset ? internalSelectedOutputAsset.value : internalSelectedInputAsset.value;
          const isSameAsOtherAsset = !!(otherSelectedAsset && otherSelectedAsset.uniqueId === extendedAsset?.uniqueId);

          if (isSameAsOtherAsset) {
            const flippedAssetOrNull =
              type === SwapAssetType.inputAsset ? internalSelectedInputAsset.value : internalSelectedOutputAsset.value;

            updateAssetValue({
              type: type === SwapAssetType.inputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset,
              asset: flippedAssetOrNull,
            });
          }
          updateAssetValue({ type, asset: isSameAsOtherAsset ? otherSelectedAsset : extendedAsset });
        } else {
          SwapInputController.quoteFetchingInterval.start();
        }

        handleProgressNavigation({ type });
      })();

      if (didSelectedAssetChange) {
        const assetToSet = insertUserAssetBalance
          ? {
              ...asset,
              balance: (asset && userAssetsStore.getState().getUserAsset(asset.uniqueId)?.balance) || asset?.balance,
            }
          : asset;

        if (isSameAsOtherAsset) {
          swapsStore.setState({
            [type === SwapAssetType.inputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset]: flippedAssetOrNull,
            [type]: otherSelectedAsset,
          });
        } else {
          swapsStore.setState({ [type]: assetToSet });
        }
      } else {
        SwapInputController.quoteFetchingInterval.start();
      }

      const shouldUpdateSelectedOutputChainId =
        type === SwapAssetType.inputAsset && swapsStore.getState().selectedOutputChainId !== extendedAsset?.chainId;
      const shouldUpdateAnimatedSelectedOutputChainId =
        type === SwapAssetType.inputAsset && selectedOutputChainId.value !== extendedAsset?.chainId;

      if (shouldUpdateSelectedOutputChainId || shouldUpdateAnimatedSelectedOutputChainId) {
        if (chainSetTimeoutId.current) {
          clearTimeout(chainSetTimeoutId.current);
        }

        // This causes a heavy re-render in the output token list, so we delay updating the selected output chain until
        // the animation is most likely complete.
        chainSetTimeoutId.current = setTimeout(() => {
          InteractionManager.runAfterInteractions(() => {
            if (shouldUpdateSelectedOutputChainId) {
              swapsStore.setState({
                selectedOutputChainId: extendedAsset?.chainId ?? ChainId.mainnet,
              });
            }
            if (shouldUpdateAnimatedSelectedOutputChainId) {
              selectedOutputChainId.value = extendedAsset?.chainId ?? ChainId.mainnet;
            }
          });
        }, 750);
      }

      logger.debug(`[setAsset]: Setting ${type} asset to ${extendedAsset?.name} on ${extendedAsset?.chainId}`);

      analyticsV2.track(analyticsV2.event.swapsSelectedAsset, {
        asset,
        otherAsset: otherSelectedAsset,
        type,
      });
    },
    [
      SwapInputController.quoteFetchingInterval,
      handleProgressNavigation,
      internalSelectedInputAsset,
      internalSelectedOutputAsset,
      selectedOutputChainId,
      updateAssetValue,
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
      SwapWarning.swapWarning.value.type === SwapWarningType.no_quote_available ||
      SwapWarning.swapWarning.value.type === SwapWarningType.no_route_found ||
      (internalSelectedInputAsset.value && equalWorklet(internalSelectedInputAsset.value.maxSwappableAmount, '0')),
    (shouldStop, previous) => {
      if (shouldStop && previous === false) {
        SwapInputController.quoteFetchingInterval.stop();
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
      lessThanOrEqualToWorklet(SwapInputController.inputValues.value.inputAmount, sellAsset.maxSwappableAmount);

    if (!enoughFundsForSwap && hasEnoughFundsForGas.value !== undefined) {
      return { label: insufficientFunds, disabled: true, type: 'hold' };
    }

    const isInputZero = equalWorklet(SwapInputController.inputValues.value.inputAmount, 0);
    const isOutputZero = equalWorklet(SwapInputController.inputValues.value.outputAmount, 0);

    const userHasNotEnteredAmount = SwapInputController.inputMethod.value !== 'slider' && isInputZero && isOutputZero;
    const userHasNotMovedSlider = SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0;

    if (userHasNotEnteredAmount || userHasNotMovedSlider) {
      return { label: enterAmount, disabled: true, opacity: 1, type: 'hold' };
    }

    const holdLabel = swapInfo.value.isBridging ? holdToBridge : holdToSwap;
    const reviewLabel = SwapSettings.degenMode.value ? holdLabel : review;

    const isQuoteError = quote.value && 'error' in quote.value;
    const isLoadingGas = !isQuoteError && hasEnoughFundsForGas.value === undefined;
    const isReviewSheetOpen = configProgress.value === NavigationSteps.SHOW_REVIEW || SwapSettings.degenMode.value;

    const isStale =
      !!isQuoteStale.value &&
      (SwapInputController.inputMethod.value !== 'slider' || sliderPressProgress.value === SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);

    if ((isFetching.value || isLoadingGas || isStale) && !isQuoteError) {
      const disabled = (isReviewSheetOpen && (isFetching.value || isLoadingGas || isStale)) || !quote.value;
      const buttonType = isReviewSheetOpen ? 'hold' : 'tap';
      return { label: fetchingPrices, disabled, type: buttonType };
    }

    const quoteUnavailable = [
      SwapWarningType.no_quote_available,
      SwapWarningType.no_route_found,
      SwapWarningType.insufficient_liquidity,
    ].includes(SwapWarning.swapWarning.value.type);

    if (quoteUnavailable || isQuoteError) {
      const icon = isReviewSheetOpen ? undefined : '􀕹';
      return { icon, label: isReviewSheetOpen ? quoteError : reviewLabel, disabled: true, type: 'hold' };
    }

    if (hasEnoughFundsForGas.value === false) {
      const nativeCurrency = getChainsNativeAssetWorklet(backendNetworks)[sellAsset?.chainId || ChainId.mainnet];
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
        quoteFetchingInterval: SwapInputController.quoteFetchingInterval,

        SwapSettings,
        SwapInputController,
        AnimatedSwapStyles,
        SwapTextStyles,
        SwapNavigation,
        SwapWarning,

        confirmButtonProps,
        confirmButtonIconStyle,

        hasEnoughFundsForGas,
      }}
    >
      {children}
      <SyncQuoteSharedValuesToState />
      <SyncGasStateToSharedValues />
    </SwapContext.Provider>
  );
};

export const useSwapContext = () => {
  const context = useContext(SwapContext);
  if (context === undefined) {
    throw new Error('useSwapContext must be used within a SwapProvider');
  }
  return context;
};

export { NavigationSteps };
