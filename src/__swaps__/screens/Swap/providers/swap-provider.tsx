// @refresh
import { default as React, ReactNode, createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { NativeModules, StyleProp, TextInput, TextStyle } from 'react-native';
import {
  AnimatedRef,
  DerivedValue,
  SharedValue,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import { INITIAL_SLIDER_POSITION, SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useAnimatedSwapStyles } from '@/__swaps__/screens/Swap/hooks/useAnimatedSwapStyles';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { NavigationSteps, useSwapNavigation } from '@/__swaps__/screens/Swap/hooks/useSwapNavigation';
import { useSwapSettings } from '@/__swaps__/screens/Swap/hooks/useSwapSettings';
import { useSwapTextStyles } from '@/__swaps__/screens/Swap/hooks/useSwapTextStyles';
import { useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { SwapAssetType, inputKeys } from '@/__swaps__/types/swap';
import { parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { getCachedProviderForNetwork, getFlashbotsProvider, isHardHat } from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { useAccountSettings } from '@/hooks';
import * as i18n from '@/languages';
import { RainbowError, logger } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { walletExecuteRap } from '@/raps/execute';
import { QuoteTypeMap, RapSwapActionParameters } from '@/raps/references';
import { queryClient } from '@/react-query';
import { userAssetsQueryKey } from '@/resources/assets/UserAssetsQuery';
import { swapsStore, useSwapsStore } from '@/state/swaps/swapsStore';
import { ethereumUtils } from '@/utils';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';

import { equalWorklet } from '@/__swaps__/safe-math/SafeMath';
import { getNetworkObj } from '@/networks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { GasSettings } from '../hooks/useCustomGas';
import { getGasSettingsBySpeed, getSelectedGas } from '../hooks/useSelectedGas';
import { useSwapOutputQuotesDisabled } from '../hooks/useSwapOutputQuotesDisabled';

const swapping = i18n.t(i18n.l.swap.actions.swapping);
const tapToSwap = i18n.t(i18n.l.swap.actions.tap_to_swap);
const save = i18n.t(i18n.l.swap.actions.save);
const enterAmount = i18n.t(i18n.l.swap.actions.enter_amount);
const review = i18n.t(i18n.l.swap.actions.review);
const fetchingPrices = i18n.t(i18n.l.swap.actions.fetching_prices);

interface SwapContextType {
  isFetching: SharedValue<boolean>;
  isSwapping: SharedValue<boolean>;
  isQuoteStale: SharedValue<number>;

  inputSearchRef: AnimatedRef<TextInput>;
  outputSearchRef: AnimatedRef<TextInput>;

  // TODO: Combine navigation progress steps into a single shared value
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  configProgress: SharedValue<number>;

  sliderXPosition: SharedValue<number>;
  sliderPressProgress: SharedValue<number>;

  lastTypedInput: SharedValue<inputKeys>;
  focusedInput: SharedValue<inputKeys>;

  selectedOutputChainId: SharedValue<ChainId>;
  setSelectedOutputChainId: (chainId: ChainId) => void;

  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  setAsset: ({ type, asset }: { type: SwapAssetType; asset: ParsedSearchAsset | null }) => void;

  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  executeSwap: () => void;

  outputQuotesAreDisabled: DerivedValue<boolean>;

  SwapSettings: ReturnType<typeof useSwapSettings>;
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  AnimatedSwapStyles: ReturnType<typeof useAnimatedSwapStyles>;
  SwapTextStyles: ReturnType<typeof useSwapTextStyles>;
  SwapNavigation: ReturnType<typeof useSwapNavigation>;
  SwapWarning: ReturnType<typeof useSwapWarning>;

  confirmButtonProps: Readonly<
    SharedValue<{
      label: string;
      icon?: string;
      disabled?: boolean;
    }>
  >;
  confirmButtonIconStyle: StyleProp<TextStyle>;

  estimatedGasLimit: SharedValue<string | undefined>;
  gasSettings: SharedValue<GasSettings | undefined>;
  userHasEnoughFundsForTx: SharedValue<boolean>;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

interface SwapProviderProps {
  children: ReactNode;
}

export const SwapProvider = ({ children }: SwapProviderProps) => {
  const { nativeCurrency } = useAccountSettings();

  const isFetching = useSharedValue(false);
  const isQuoteStale = useSharedValue(0); // TODO: Convert this to a boolean
  const isSwapping = useSharedValue(false);

  const inputSearchRef = useAnimatedRef<TextInput>();
  const outputSearchRef = useAnimatedRef<TextInput>();

  const sliderXPosition = useSharedValue(SLIDER_WIDTH * INITIAL_SLIDER_POSITION);
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);

  const lastTypedInput = useSharedValue<inputKeys>('inputAmount');
  const focusedInput = useSharedValue<inputKeys>('inputAmount');

  const initialSelectedInputAsset = parseAssetAndExtend({ asset: swapsStore.getState().inputAsset });
  const initialSelectedOutputAsset = parseAssetAndExtend({ asset: swapsStore.getState().outputAsset });

  const internalSelectedInputAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(initialSelectedInputAsset);
  const internalSelectedOutputAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(initialSelectedOutputAsset);

  const selectedOutputChainId = useSharedValue<ChainId>(initialSelectedInputAsset?.chainId || ChainId.mainnet);
  const quote = useSharedValue<Quote | CrosschainQuote | QuoteError | null>(null);

  const inputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const outputProgress = useSharedValue(
    initialSelectedOutputAsset ? NavigationSteps.INPUT_ELEMENT_FOCUSED : NavigationSteps.TOKEN_LIST_FOCUSED
  );
  const configProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);

  const SwapSettings = useSwapSettings({
    inputAsset: internalSelectedInputAsset,
  });

  const SwapInputController = useSwapInputsController({
    focusedInput,
    lastTypedInput,
    inputProgress,
    outputProgress,
    initialSelectedInputAsset,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
    isQuoteStale,
    sliderXPosition,
    quote,
  });

  const getNonceAndPerformSwap = async ({
    type,
    parameters,
  }: {
    type: 'swap' | 'crosschainSwap';
    parameters: Omit<RapSwapActionParameters<typeof type>, 'gasParams' | 'gasFeeParamsBySpeed' | 'selectedGasFee'>;
  }) => {
    const NotificationManager = ios ? NativeModules.NotificationManager : null;
    NotificationManager?.postNotification('rapInProgress');

    const resetSwappingStatus = () => {
      'worklet';
      isSwapping.value = false;
    };

    const network = ethereumUtils.getNetworkFromChainId(parameters.chainId);
    const provider =
      parameters.flashbots && getNetworkObj(network).features.flashbots
        ? await getFlashbotsProvider()
        : getCachedProviderForNetwork(network);
    const providerUrl = provider?.connection?.url;
    const connectedToHardhat = isHardHat(providerUrl);

    const selectedGas = getSelectedGas(parameters.chainId);
    if (!selectedGas) {
      runOnUI(resetSwappingStatus)();
      Alert.alert(i18n.t(i18n.l.gas.unable_to_determine_selected_gas));
      return;
    }

    const wallet = await loadWallet(parameters.quote.from, false, provider);
    if (!wallet) {
      runOnUI(resetSwappingStatus)();
      Alert.alert(i18n.t(i18n.l.swap.unable_to_load_wallet));
      return;
    }

    const gasFeeParamsBySpeed = getGasSettingsBySpeed(parameters.chainId);

    let gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = {} as
      | TransactionGasParamAmounts
      | LegacyTransactionGasParamAmounts;

    if (selectedGas.isEIP1559) {
      gasParams = {
        maxFeePerGas: selectedGas.maxBaseFee,
        maxPriorityFeePerGas: selectedGas.maxPriorityFee,
      };
    } else {
      gasParams = {
        gasPrice: selectedGas.gasPrice,
      };
    }

    const { errorMessage } = await walletExecuteRap(wallet, type, {
      ...parameters,
      gasParams,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gasFeeParamsBySpeed: gasFeeParamsBySpeed as any,
    });
    runOnUI(resetSwappingStatus)();

    if (errorMessage) {
      SwapInputController.quoteFetchingInterval.start();

      if (errorMessage !== 'handled') {
        logger.error(new RainbowError(`[getNonceAndPerformSwap]: Error executing swap: ${errorMessage}`));
        const extractedError = errorMessage.split('[')[0];
        Alert.alert(i18n.t(i18n.l.swap.error_executing_swap), extractedError);
        return;
      }
    }

    queryClient.invalidateQueries({
      queryKey: userAssetsQueryKey({
        address: parameters.quote.from,
        currency: nativeCurrency,
        connectedToHardhat,
      }),
    });

    // TODO: Analytics
    NotificationManager?.postNotification('rapCompleted');
    Navigation.handleAction(Routes.PROFILE_SCREEN, {});
  };

  const executeSwap = () => {
    'worklet';

    // TODO: Analytics
    if (configProgress.value !== NavigationSteps.SHOW_REVIEW) return;

    const inputAsset = internalSelectedInputAsset.value;
    const outputAsset = internalSelectedOutputAsset.value;
    const q = quote.value;

    // TODO: What other checks do we need here?
    if (!inputAsset || !outputAsset || !q || (q as QuoteError)?.error) {
      return;
    }

    isSwapping.value = true;
    SwapInputController.quoteFetchingInterval.stop();

    const type = inputAsset.chainId !== outputAsset.chainId ? 'crosschainSwap' : 'swap';
    const quoteData = q as QuoteTypeMap[typeof type];
    const flashbots = (SwapSettings.flashbots.value && inputAsset.chainId === ChainId.mainnet) ?? false;

    const parameters: Omit<RapSwapActionParameters<typeof type>, 'gasParams' | 'gasFeeParamsBySpeed' | 'selectedGasFee'> = {
      sellAmount: quoteData.sellAmount?.toString(),
      buyAmount: quoteData.buyAmount?.toString(),
      chainId: inputAsset.chainId,
      assetToSell: inputAsset,
      assetToBuy: outputAsset,
      quote: quoteData,
      flashbots,
    };

    runOnJS(getNonceAndPerformSwap)({
      type,
      parameters,
    });
  };

  const SwapTextStyles = useSwapTextStyles({
    inputMethod: SwapInputController.inputMethod,
    inputValues: SwapInputController.inputValues,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
    isQuoteStale,
    focusedInput,
    inputProgress,
    outputProgress,
    sliderPressProgress,
  });

  const SwapNavigation = useSwapNavigation({
    configProgress,
    executeSwap,
    inputProgress,
    outputProgress,
    quoteFetchingInterval: SwapInputController.quoteFetchingInterval,
    selectedInputAsset: internalSelectedInputAsset,
    selectedOutputAsset: internalSelectedOutputAsset,
  });

  const SwapWarning = useSwapWarning({
    inputAsset: internalSelectedInputAsset,
    inputValues: SwapInputController.inputValues,
    outputAsset: internalSelectedOutputAsset,
    quote,
    sliderXPosition,
    isFetching,
    isQuoteStale,
  });

  const AnimatedSwapStyles = useAnimatedSwapStyles({
    SwapWarning,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    inputProgress,
    outputProgress,
    configProgress,
    isFetching,
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
          }
          break;
      }
    },
    [internalSelectedInputAsset, internalSelectedOutputAsset, inputProgress, outputProgress]
  );

  const setSelectedOutputChainId = (chainId: ChainId) => {
    const updateChainId = (chainId: ChainId) => {
      'worklet';
      selectedOutputChainId.value = chainId;
    };

    runOnUI(updateChainId)(chainId);
    useSwapsStore.setState({ selectedOutputChainId: chainId });
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
      const insertUserAssetBalance = type === SwapAssetType.outputAsset;
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
          ? { ...asset, balance: (asset && userAssetsStore.getState().getUserAsset(asset.uniqueId)?.balance) || asset?.balance }
          : asset;

        if (isSameAsOtherAsset) {
          useSwapsStore.setState({
            [type === SwapAssetType.inputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset]: flippedAssetOrNull,
            [type]: otherSelectedAsset,
          });
        } else {
          useSwapsStore.setState({ [type]: assetToSet });
        }
      } else {
        SwapInputController.quoteFetchingInterval.start();
      }

      const shouldUpdateSelectedOutputChainId =
        type === SwapAssetType.inputAsset && useSwapsStore.getState().selectedOutputChainId !== extendedAsset?.chainId;
      const shouldUpdateAnimatedSelectedOutputChainId =
        type === SwapAssetType.inputAsset && selectedOutputChainId.value !== extendedAsset?.chainId;

      if (shouldUpdateSelectedOutputChainId || shouldUpdateAnimatedSelectedOutputChainId) {
        if (chainSetTimeoutId.current) {
          clearTimeout(chainSetTimeoutId.current);
        }

        // This causes a heavy re-render in the output token list, so we delay updating the selected output chain until
        // the animation is most likely complete.
        chainSetTimeoutId.current = setTimeout(() => {
          if (shouldUpdateSelectedOutputChainId) {
            useSwapsStore.setState({
              selectedOutputChainId: extendedAsset?.chainId ?? ChainId.mainnet,
            });
          }
          if (shouldUpdateAnimatedSelectedOutputChainId) {
            selectedOutputChainId.value = extendedAsset?.chainId ?? ChainId.mainnet;
          }
        }, 750);
      }

      logger.debug(`[setAsset]: Setting ${type} asset to ${extendedAsset?.name} on ${extendedAsset?.chainId}`);
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

  const gasSettings = useSharedValue<GasSettings | undefined>(undefined);
  const estimatedGasLimit = useSharedValue<string | undefined>(undefined);
  const userHasEnoughFundsForTx = useSharedValue<boolean>(true);

  const confirmButtonProps = useDerivedValue(() => {
    if (isSwapping.value) {
      return { label: 'Swapping...', disabled: true };
    }

    if (configProgress.value === NavigationSteps.SHOW_REVIEW) {
      return { icon: '􀎽', label: 'Hold to Swap', disabled: false };
    }

    if (configProgress.value === NavigationSteps.SHOW_GAS) {
      return { icon: '􀆅', label: 'Save', disabled: false };
    }

    if (isFetching.value) {
      return { label: 'Fetching...', disabled: true };
    }

    const hasSelectedAssets = internalSelectedInputAsset.value && internalSelectedOutputAsset.value;
    if (!hasSelectedAssets) return { label: 'Select Token', disabled: true };

    if (!quote.value || 'error' in quote.value) return { label: 'Error', disabled: true };

    const isInputZero = equalWorklet(SwapInputController.inputValues.value.inputAmount, 0);
    const isOutputZero = equalWorklet(SwapInputController.inputValues.value.outputAmount, 0);

    if (SwapInputController.percentageToSwap.value === 0 || isInputZero || isOutputZero) {
      return { label: 'Enter Amount', disabled: true };
    }

    if (!estimatedGasLimit.value) return { label: 'Estimating...', disabled: true };

    if (!gasSettings.value) {
      // this could happen if metereology is down, or some other edge cases that are not properly handled yet
      return { label: 'Error', disabled: true };
    }

    if (!userHasEnoughFundsForTx.value) {
      return { label: 'Insufficient Funds', disabled: true };
    }

    return { icon: '􀕹', label: 'Review', disabled: false };
  });

  const confirmButtonIconStyle = useAnimatedStyle(() => {
    const isInputZero = equalWorklet(SwapInputController.inputValues.value.inputAmount, 0);
    const isOutputZero = equalWorklet(SwapInputController.inputValues.value.outputAmount, 0);

    const sliderCondition =
      SwapInputController.inputMethod.value === 'slider' &&
      (SwapInputController.percentageToSwap.value === 0 || isInputZero || isOutputZero);
    const inputCondition = SwapInputController.inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching.value;

    const shouldHide = sliderCondition || inputCondition;

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

        internalSelectedInputAsset,
        internalSelectedOutputAsset,
        setAsset,

        quote,
        outputQuotesAreDisabled,
        executeSwap,

        SwapSettings,
        SwapInputController,
        AnimatedSwapStyles,
        SwapTextStyles,
        SwapNavigation,
        SwapWarning,

        confirmButtonProps,
        confirmButtonIconStyle,

        estimatedGasLimit,
        gasSettings,
        userHasEnoughFundsForTx,
      }}
    >
      {children}
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
