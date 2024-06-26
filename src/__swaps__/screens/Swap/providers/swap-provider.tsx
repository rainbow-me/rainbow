// @refresh
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useRef } from 'react';
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
} from 'react-native-reanimated';

import { equalWorklet, lessThanOrEqualToWorklet } from '@/__swaps__/safe-math/SafeMath';
import { INITIAL_SLIDER_POSITION, SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useAnimatedSwapStyles } from '@/__swaps__/screens/Swap/hooks/useAnimatedSwapStyles';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { NavigationSteps, useSwapNavigation } from '@/__swaps__/screens/Swap/hooks/useSwapNavigation';
import { useSwapSettings } from '@/__swaps__/screens/Swap/hooks/useSwapSettings';
import { useSwapTextStyles } from '@/__swaps__/screens/Swap/hooks/useSwapTextStyles';
import { SwapWarningType, useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { userAssetsQueryKey as swapsUserAssetsQueryKey } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import { AddressOrEth, ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { SwapAssetType, inputKeys } from '@/__swaps__/types/swap';
import { isUnwrapEthWorklet, isWrapEthWorklet, parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { analyticsV2 } from '@/analytics';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { getFlashbotsProvider, getIsHardhatConnected, getProviderForNetwork, isHardHat } from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { useAccountSettings } from '@/hooks';
import * as i18n from '@/languages';
import { RainbowError, logger } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { getNetworkObj } from '@/networks';
import { walletExecuteRap } from '@/raps/execute';
import { QuoteTypeMap, RapSwapActionParameters } from '@/raps/references';
import { queryClient } from '@/react-query';
import { userAssetsQueryKey } from '@/resources/assets/UserAssetsQuery';
import { userAssetsStore } from '@/state/assets/userAssets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { ethereumUtils, haptics } from '@/utils';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';

import { Address } from 'viem';
import { clearCustomGasSettings } from '../hooks/useCustomGas';
import { getGasSettingsBySpeed, getSelectedGas, getSelectedGasSpeed } from '../hooks/useSelectedGas';
import { useSwapOutputQuotesDisabled } from '../hooks/useSwapOutputQuotesDisabled';
import { SyncGasStateToSharedValues, SyncQuoteSharedValuesToState } from './SyncSwapStateAndSharedValues';
import { IS_IOS } from '@/env';

const swapping = i18n.t(i18n.l.swap.actions.swapping);
const tapToSwap = i18n.t(i18n.l.swap.actions.tap_to_swap);
const save = i18n.t(i18n.l.swap.actions.save);
const enterAmount = i18n.t(i18n.l.swap.actions.enter_amount);
const review = i18n.t(i18n.l.swap.actions.review);
const fetchingPrices = i18n.t(i18n.l.swap.actions.fetching_prices);
const selectToken = i18n.t(i18n.l.swap.actions.select_token);
const insufficientFunds = i18n.t(i18n.l.swap.actions.insufficient_funds);
const quoteError = i18n.t(i18n.l.swap.actions.quote_error);

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

  confirmButtonProps: Readonly<
    SharedValue<{
      label: string;
      icon?: string;
      disabled?: boolean;
      opacity?: number;
    }>
  >;
  confirmButtonIconStyle: StyleProp<TextStyle>;

  hasEnoughFundsForGas: SharedValue<boolean | undefined>;
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
  const inputProgress = useSharedValue(
    initialSelectedOutputAsset && !initialSelectedInputAsset ? NavigationSteps.TOKEN_LIST_FOCUSED : NavigationSteps.INPUT_ELEMENT_FOCUSED
  );
  const outputProgress = useSharedValue(
    initialSelectedOutputAsset ? NavigationSteps.INPUT_ELEMENT_FOCUSED : NavigationSteps.TOKEN_LIST_FOCUSED
  );
  const configProgress = useSharedValue<NavigationSteps>(NavigationSteps.INPUT_ELEMENT_FOCUSED);

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
    try {
      const NotificationManager = IS_IOS ? NativeModules.NotificationManager : null;
      NotificationManager?.postNotification('rapInProgress');

      const network = ethereumUtils.getNetworkFromChainId(parameters.chainId);
      const provider =
        parameters.flashbots && getNetworkObj(network).features.flashbots ? await getFlashbotsProvider() : getProviderForNetwork(network);
      const providerUrl = provider?.connection?.url;
      const connectedToHardhat = !!providerUrl && isHardHat(providerUrl);

      const isBridge = swapsStore.getState().inputAsset?.mainnetAddress === swapsStore.getState().outputAsset?.mainnetAddress;
      const slippage = swapsStore.getState().slippage;

      const selectedGas = getSelectedGas(parameters.chainId);
      if (!selectedGas) {
        isSwapping.value = false;
        Alert.alert(i18n.t(i18n.l.gas.unable_to_determine_selected_gas));
        return;
      }

      const wallet = await loadWallet(parameters.quote.from, false, provider);
      if (!wallet) {
        isSwapping.value = false;
        haptics.notificationError();
        return;
      }

      const gasFeeParamsBySpeed = getGasSettingsBySpeed(parameters.chainId);
      const selectedGasSpeed = getSelectedGasSpeed(parameters.chainId);

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

      const chainId = getIsHardhatConnected() ? ChainId.hardhat : parameters.chainId;
      const { errorMessage } = await walletExecuteRap(wallet, type, {
        ...parameters,
        chainId,
        gasParams,
        // @ts-expect-error - collision between old gas types and new
        gasFeeParamsBySpeed: gasFeeParamsBySpeed,
      });
      isSwapping.value = false;

      if (errorMessage) {
        SwapInputController.quoteFetchingInterval.start();

        analyticsV2.track(analyticsV2.event.swapsFailed, {
          createdAt: Date.now(),
          type,
          parameters,
          selectedGas,
          selectedGasSpeed,
          slippage,
          bridge: isBridge,
          errorMessage,
          inputNativeValue: SwapInputController.inputValues.value.inputNativeValue,
          outputNativeValue: SwapInputController.inputValues.value.outputNativeValue,
        });

        if (errorMessage !== 'handled') {
          logger.error(new RainbowError(`[getNonceAndPerformSwap]: Error executing swap: ${errorMessage}`));
          const extractedError = errorMessage.split('[')[0];
          Alert.alert(i18n.t(i18n.l.swap.error_executing_swap), extractedError);
          return;
        }
      }

      queryClient.invalidateQueries([
        // old user assets invalidation (will cause a re-fetch)
        {
          queryKey: userAssetsQueryKey({
            address: parameters.quote.from,
            currency: nativeCurrency,
            connectedToHardhat,
          }),
        },
        // new swaps user assets invalidations
        {
          queryKey: swapsUserAssetsQueryKey({
            address: parameters.quote.from as Address,
            currency: nativeCurrency,
            testnetMode: !!connectedToHardhat,
          }),
        },
      ]);

      clearCustomGasSettings(chainId);
      NotificationManager?.postNotification('rapCompleted');
      Navigation.handleAction(Routes.PROFILE_SCREEN, {});

      analyticsV2.track(analyticsV2.event.swapsSubmitted, {
        createdAt: Date.now(),
        type,
        parameters,
        selectedGas,
        selectedGasSpeed,
        slippage,
        bridge: isBridge,
        inputNativeValue: SwapInputController.inputValues.value.inputNativeValue,
        outputNativeValue: SwapInputController.inputValues.value.outputNativeValue,
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
  };

  const executeSwap = () => {
    'worklet';

    if (configProgress.value !== NavigationSteps.SHOW_REVIEW) return;

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
    const flashbots = (SwapSettings.flashbots.value && inputAsset.chainId === ChainId.mainnet) ?? false;

    const isNativeWrapOrUnwrap =
      isWrapEthWorklet({
        buyTokenAddress: quoteData.buyTokenAddress,
        sellTokenAddress: quoteData.sellTokenAddress,
        chainId: inputAsset.chainId,
      }) ||
      isUnwrapEthWorklet({
        buyTokenAddress: quoteData.buyTokenAddress,
        sellTokenAddress: quoteData.sellTokenAddress,
        chainId: inputAsset.chainId,
      });

    // Do not deleeeet the comment below 😤
    // About to get quote
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
        fromChainId: inputAsset.chainId,
        toChainId: outputAsset.chainId,
      },
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
          ? { ...asset, balance: (asset && userAssetsStore.getState().getUserAsset(asset.uniqueId)?.balance) || asset?.balance }
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

  const hasEnoughFundsForGas = useSharedValue<boolean | undefined>(undefined);
  useAnimatedReaction(
    () => isFetching.value,
    fetching => {
      if (fetching) hasEnoughFundsForGas.value = undefined;
    }
  );

  const confirmButtonProps = useDerivedValue(() => {
    if (isSwapping.value) {
      return { label: swapping, disabled: true };
    }

    if (configProgress.value === NavigationSteps.SHOW_GAS) {
      return { icon: '􀆅', label: save, disabled: false };
    }

    const hasSelectedAssets = internalSelectedInputAsset.value && internalSelectedOutputAsset.value;
    if (!hasSelectedAssets) {
      return { label: selectToken, disabled: true };
    }

    const isInputZero = equalWorklet(SwapInputController.inputValues.value.inputAmount, 0);
    const isOutputZero = equalWorklet(SwapInputController.inputValues.value.outputAmount, 0);

    const userHasNotEnteredAmount = SwapInputController.inputMethod.value !== 'slider' && isInputZero && isOutputZero;

    const userHasNotMovedSlider = SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0;

    if (userHasNotEnteredAmount || userHasNotMovedSlider) {
      return { label: enterAmount, disabled: true, opacity: 1 };
    }

    if (
      [SwapWarningType.no_quote_available, SwapWarningType.no_route_found, SwapWarningType.insufficient_liquidity].includes(
        SwapWarning.swapWarning.value.type
      )
    ) {
      return { icon: '􀕹', label: review, disabled: true };
    }

    const sellAsset = internalSelectedInputAsset.value;
    const enoughFundsForSwap =
      sellAsset && lessThanOrEqualToWorklet(SwapInputController.inputValues.value.inputAmount, sellAsset.maxSwappableAmount);

    if (!enoughFundsForSwap) {
      return { label: insufficientFunds, disabled: true };
    }

    const isQuoteError = quote.value && 'error' in quote.value;
    const isLoadingGas = !isQuoteError && hasEnoughFundsForGas.value === undefined;
    const isReviewSheetOpen = configProgress.value === NavigationSteps.SHOW_REVIEW;

    if ((isFetching.value || isLoadingGas) && !isQuoteError) {
      return { label: fetchingPrices, disabled: (isReviewSheetOpen && isFetching.value) || !quote.value };
    }

    if (isQuoteError) {
      return { icon: isReviewSheetOpen ? undefined : '􀕹', label: isReviewSheetOpen ? quoteError : review, disabled: true };
    }

    if (!hasEnoughFundsForGas.value) {
      return { label: insufficientFunds, disabled: true };
    }

    if (isReviewSheetOpen) {
      return { icon: '􀎽', label: tapToSwap, disabled: false };
    }

    return { icon: '􀕹', label: review, disabled: false };
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

        handleProgressNavigation,
        internalSelectedInputAsset,
        internalSelectedOutputAsset,
        setAsset,

        quote,
        outputQuotesAreDisabled,
        swapInfo,
        executeSwap,

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
