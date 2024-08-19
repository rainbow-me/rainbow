import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import { isEmpty, isEqual } from 'lodash';
import React, { MutableRefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import equal from 'react-fast-compare';
import { EmitterSubscription, InteractionManager, Keyboard, NativeModules, TextInput, View } from 'react-native';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';
import { useMemoOne } from 'use-memo-one';
import { dismissingScreenListener } from '../../shim';
import {
  ConfirmExchangeButton,
  ExchangeDetailsRow,
  ExchangeFloatingPanels,
  ExchangeHeader,
  ExchangeInputField,
  ExchangeNotch,
  ExchangeOutputField,
} from '../components/exchange';
import { FloatingPanel } from '../components/floating-panels';
import { GasSpeedButton } from '../components/gas';
import { KeyboardFixedOpenLayout } from '../components/layout';
import { delayNext } from '../hooks/useMagicAutofocus';
import { getRemoteConfig, useRemoteConfig } from '@/model/remoteConfig';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@/analytics';
import { Box, Row, Rows } from '@/design-system';
import { GasFee, LegacyGasFee, LegacyGasFeeParams, SwappableAsset } from '@/entities';
import { ExchangeModalTypes, isKeyboardOpen } from '@/helpers';
import { KeyboardType } from '@/helpers/keyboardTypes';
import { getFlashbotsProvider, getProvider } from '@/handlers/web3';
import { delay, greaterThan } from '@/helpers/utilities';
import {
  useAccountSettings,
  useColorForAsset,
  useGas,
  usePrevious,
  usePriceImpactDetails,
  useSwapCurrencies,
  useSwapCurrencyHandlers,
  useSwapDerivedOutputs,
  useSwapInputHandlers,
  useSwapInputRefs,
  useSwapIsSufficientBalance,
  useSwapSettings,
  useWallets,
} from '@/hooks';
import { loadWallet } from '@/model/wallet';
import { useNavigation } from '@/navigation';
import { walletExecuteRap } from '@/raps/execute';
import { swapClearState, SwapModalField, TypeSpecificParameters, updateSwapSlippage, updateSwapTypeDetails } from '@/redux/swap';
import { ethUnits } from '@/references';
import Routes from '@/navigation/routesNames';
import { ethereumUtils, gasUtils } from '@/utils';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';
import { logger, RainbowError } from '@/logger';
import { CROSSCHAIN_SWAPS, useExperimentalFlag } from '@/config';
import { CrosschainQuote, Quote } from '@rainbow-me/swaps';
import store from '@/redux/store';
import { getCrosschainSwapServiceTime, isUnwrapNative, isWrapNative } from '@/handlers/swap';
import useParamsForExchangeModal from '@/hooks/useParamsForExchangeModal';
import { Wallet } from '@ethersproject/wallet';
import { setHardwareTXError } from '@/navigation/HardwareWalletTxNavigator';
import { useTheme } from '@/theme';
import Animated from 'react-native-reanimated';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { ReviewPromptAction } from '@/storage/schema';
import { SwapPriceImpactType } from '@/hooks/usePriceImpactDetails';
import { getNextNonce } from '@/state/nonces';
import { getChainName } from '@/__swaps__/utils/chains';
import { ChainId, ChainName } from '@/networks/types';
import { AddressOrEth, ParsedAsset } from '@/__swaps__/types/assets';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { estimateSwapGasLimit } from '@/raps/actions';
import { estimateCrosschainSwapGasLimit } from '@/raps/actions/crosschainSwap';
import { parseGasParamAmounts } from '@/parsers';
import { networkObjects } from '@/networks';

export const DEFAULT_SLIPPAGE_BIPS = {
  [ChainId.mainnet]: 100,
  [ChainId.polygon]: 200,
  [ChainId.base]: 200,
  [ChainId.bsc]: 200,
  [ChainId.optimism]: 200,
  [ChainId.arbitrum]: 200,
  [ChainId.goerli]: 100,
  [ChainId.gnosis]: 200,
  [ChainId.zora]: 200,
  [ChainId.avalanche]: 200,
  [ChainId.blast]: 200,
  [ChainId.degen]: 200,
};

export const getDefaultSlippageFromConfig = (chainId: ChainId) => {
  const configSlippage = getRemoteConfig().default_slippage_bips as unknown as {
    [network: string]: number;
  };
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const slippage = configSlippage?.[network] ?? DEFAULT_SLIPPAGE_BIPS[chainId] ?? 100;
  return slippage;
};
const NOOP = () => null;

const FloatingPanels = Animated.createAnimatedComponent(ExchangeFloatingPanels);

const Wrapper = KeyboardFixedOpenLayout;

interface ExchangeModalProps {
  fromDiscover: boolean;
  ignoreInitialTypeCheck?: boolean;
  testID: string;
  type: keyof typeof ExchangeModalTypes;
  typeSpecificParams: TypeSpecificParameters;
}

export function ExchangeModal({ fromDiscover, ignoreInitialTypeCheck, testID, type, typeSpecificParams }: ExchangeModalProps) {
  const { isHardwareWallet } = useWallets();
  const dispatch = useDispatch();
  const { slippageInBips, maxInputUpdate, flipCurrenciesUpdate } = useSwapSettings();
  const {
    params: { inputAsset: defaultInputAsset, outputAsset: defaultOutputAsset },
  } = useRoute<{
    key: string;
    name: string;
    params: { inputAsset: SwappableAsset; outputAsset: SwappableAsset };
  }>();
  const { default_slippage_bips } = useRemoteConfig();

  const crosschainSwapsEnabled = useExperimentalFlag(CROSSCHAIN_SWAPS);

  useLayoutEffect(() => {
    dispatch(updateSwapTypeDetails(type, typeSpecificParams));
  }, [dispatch, type, typeSpecificParams]);

  const title = lang.t('swap.modal_types.swap');

  const { goBack, navigate, setParams, getParent: dangerouslyGetParent, addListener } = useNavigation();

  const {
    selectedGasFee,
    gasFeeParamsBySpeed,
    startPollingGasFees,
    stopPollingGasFees,
    updateDefaultGasLimit,
    updateGasFeeOption,
    updateTxFee,
    chainId,
    isGasReady,
  } = useGas();
  const { accountAddress, flashbotsEnabled, nativeCurrency } = useAccountSettings();

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const prevGasFeesParamsBySpeed = usePrevious(gasFeeParamsBySpeed);
  const prevChainId = usePrevious(chainId);

  const keyboardListenerSubscription = useRef<EmitterSubscription>();

  useAndroidBackHandler(() => {
    navigate(Routes.WALLET_SCREEN);
    return true;
  });

  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const { colors } = useTheme();
  const inputCurrencyColor = useColorForAsset(inputCurrency, colors.appleBlue);
  const outputCurrencyColor = useColorForAsset(outputCurrency, colors.appleBlue);

  const { handleFocus, inputFieldRef, lastFocusedInputHandle, setLastFocusedInputHandle, nativeFieldRef, outputFieldRef } =
    useSwapInputRefs();

  const { updateInputAmount, updateMaxInputAmount, updateNativeAmount, updateOutputAmount } = useSwapInputHandlers();

  const { inputChainId, outputChainId, currentChainId, isCrosschainSwap, isBridgeSwap } = useMemo(() => {
    const inputChainId = inputCurrency?.chainId || ChainId.mainnet;
    const outputChainId = outputCurrency?.chainId || ChainId.mainnet;
    const chainId: ChainId = inputChainId || outputChainId;

    const isCrosschainSwap = crosschainSwapsEnabled && inputChainId !== outputChainId;
    const isBridgeSwap = inputCurrency?.symbol === outputCurrency?.symbol;
    return {
      inputChainId,
      outputChainId,
      currentChainId: chainId,
      isCrosschainSwap,
      isBridgeSwap,
    };
  }, [inputCurrency?.chainId, inputCurrency?.symbol, outputCurrency?.chainId, outputCurrency?.symbol, crosschainSwapsEnabled]);

  const { flipCurrencies, navigateToSelectInputCurrency, navigateToSelectOutputCurrency } = useSwapCurrencyHandlers({
    inputChainId,
    outputChainId,
    defaultInputAsset,
    defaultOutputAsset,
    fromDiscover,
    ignoreInitialTypeCheck,
    inputFieldRef,
    lastFocusedInputHandle,
    nativeFieldRef,
    outputFieldRef,
    setLastFocusedInputHandle,
    title,
    type,
  });
  const speedUrgentSelected = useRef(false);

  const networkObject = useMemo(() => networkObjects[currentChainId], [currentChainId]);

  useEffect(() => {
    if (!speedUrgentSelected.current && !isEmpty(gasFeeParamsBySpeed) && networkObject.swaps?.defaultToFastGas) {
      // Default to fast for networks with speed options
      updateGasFeeOption(gasUtils.FAST);
      speedUrgentSelected.current = true;
    }
  }, [currentChainId, gasFeeParamsBySpeed, networkObject.swaps?.defaultToFastGas, selectedGasFee, updateGasFeeOption, updateTxFee]);

  useEffect(() => {
    if (currentChainId !== prevChainId) {
      speedUrgentSelected.current = false;
    }
  }, [currentChainId, prevChainId]);

  const defaultGasLimit = useMemo(() => {
    return ethereumUtils.getBasicSwapGasLimit(Number(currentChainId));
  }, [currentChainId]);

  const {
    result: {
      derivedValues: { inputAmount, outputAmount },
      displayValues: { inputAmountDisplay, outputAmountDisplay, nativeAmountDisplay },
      tradeDetails,
    },
    loading,
    resetSwapInputs,
    quoteError,
  } = useSwapDerivedOutputs(type);

  const lastTradeDetails = usePrevious(tradeDetails);
  const isSufficientBalance = useSwapIsSufficientBalance(inputAmount);

  const { priceImpact, outputNativeAmount } = usePriceImpactDetails(inputCurrency, outputCurrency, tradeDetails, currentChainId);
  const [debouncedIsHighPriceImpact] = useDebounce(priceImpact.type !== SwapPriceImpactType.none, 1000);
  // For a limited period after the merge we need to block the use of flashbots.
  // This line should be removed after reenabling flashbots in remote config.
  const swapSupportsFlashbots = networkObjects[currentChainId].features.flashbots;
  const flashbots = swapSupportsFlashbots && flashbotsEnabled;

  const isDismissing = useRef(false);
  useEffect(() => {
    if (ios) {
      return;
    }
    (dismissingScreenListener.current as unknown as () => void) = () => {
      Keyboard.dismiss();
      isDismissing.current = true;
    };
    const unsubscribe = (dangerouslyGetParent()?.getParent()?.addListener || addListener)(
      // @ts-expect-error - Not sure if this is even triggered as React Navigation apparently doesnt emit this event.
      'transitionEnd',
      // @ts-expect-error - Can't find any docs around this closing prop being sent is this a private API?
      ({ data: { closing } }) => {
        if (!closing && isDismissing.current) {
          isDismissing.current = false;
          (lastFocusedInputHandle as unknown as MutableRefObject<TextInput>)?.current?.focus();
        }
      }
    );
    return () => {
      unsubscribe();
      dismissingScreenListener.current = undefined;
    };
  }, [addListener, dangerouslyGetParent, lastFocusedInputHandle]);

  useEffect(() => {
    const slippage = getDefaultSlippageFromConfig(currentChainId);
    slippage && dispatch(updateSwapSlippage(slippage));
  }, [currentChainId, default_slippage_bips, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(swapClearState());
      resetSwapInputs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateGasLimit = useCallback(async () => {
    try {
      const provider = getProvider({ chainId: currentChainId });

      const quote = isCrosschainSwap ? (tradeDetails as CrosschainQuote) : (tradeDetails as Quote);
      const gasLimit = await (isCrosschainSwap ? estimateCrosschainSwapGasLimit : estimateSwapGasLimit)({
        chainId: currentChainId,
        quote: quote as CrosschainQuote,
      });

      if (gasLimit) {
        if (networkObject.gas?.OptimismTxFee) {
          if (tradeDetails) {
            const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              {
                data: tradeDetails.data,
                from: tradeDetails.from,
                to: tradeDetails.to ?? null,
                value: tradeDetails.value,
              },
              provider
            );
            updateTxFee(gasLimit, null, l1GasFeeOptimism);
          } else {
            updateTxFee(gasLimit, null, ethUnits.default_l1_gas_fee_optimism_swap);
          }
        } else {
          updateTxFee(gasLimit, null);
        }
      }
    } catch (error) {
      updateTxFee(defaultGasLimit, null);
    }
  }, [currentChainId, defaultGasLimit, isCrosschainSwap, networkObject.gas?.OptimismTxFee, tradeDetails, updateTxFee]);

  useEffect(() => {
    if (tradeDetails && !equal(tradeDetails, lastTradeDetails)) {
      updateGasLimit();
    }
  }, [lastTradeDetails, tradeDetails, updateGasLimit]);

  // Set default gas limit
  useEffect(() => {
    if (isEmpty(prevGasFeesParamsBySpeed) && !isEmpty(gasFeeParamsBySpeed)) {
      updateTxFee(defaultGasLimit, null);
    }
  }, [defaultGasLimit, gasFeeParamsBySpeed, prevGasFeesParamsBySpeed, updateTxFee]);

  // Update gas limit
  useEffect(() => {
    if (
      !isGasReady ||
      (!prevChainId && currentChainId !== prevChainId) ||
      (!isEmpty(gasFeeParamsBySpeed) && !isEqual(gasFeeParamsBySpeed, prevGasFeesParamsBySpeed))
    ) {
      updateGasLimit();
    }
  }, [currentChainId, gasFeeParamsBySpeed, isGasReady, prevChainId, prevGasFeesParamsBySpeed, updateGasLimit]);

  // Listen to gas prices, Uniswap reserves updates
  useEffect(() => {
    updateDefaultGasLimit(defaultGasLimit);
    InteractionManager.runAfterInteractions(() => {
      // Start polling in the current network
      startPollingGasFees(currentChainId, flashbots);
    });
    return () => {
      stopPollingGasFees();
    };
  }, [defaultGasLimit, currentChainId, startPollingGasFees, stopPollingGasFees, updateDefaultGasLimit, flashbots]);

  const checkGasVsOutput = async (gasPrice: string, outputPrice: string) => {
    if (greaterThan(outputPrice, 0) && greaterThan(gasPrice, outputPrice) && !(IS_ANDROID && IS_TEST)) {
      const res = new Promise(resolve => {
        Alert.alert(lang.t('swap.warning.cost.are_you_sure_title'), lang.t('swap.warning.cost.this_transaction_will_cost_you_more'), [
          {
            onPress: () => {
              resolve(false);
            },
            text: lang.t('button.proceed_anyway'),
          },
          {
            onPress: () => {
              resolve(true);
            },
            style: 'cancel',
            text: lang.t('button.cancel'),
          },
        ]);
      });
      return res;
    } else {
      return false;
    }
  };

  const isFillingParams = useParamsForExchangeModal({
    inputFieldRef,
    outputFieldRef,
    nativeFieldRef,
  });

  const submit = useCallback(
    async (amountInUSD: string): Promise<boolean> => {
      setIsAuthorizing(true);
      const NotificationManager = ios ? NativeModules.NotificationManager : null;
      try {
        // load the correct network provider for the wallet
        const provider = getProvider({ chainId: currentChainId });
        let wallet = await loadWallet({
          address: accountAddress,
          showErrorIfNotLoaded: false,
          provider,
        });
        if (!wallet) {
          setIsAuthorizing(false);
          logger.error(new RainbowError(`[ExchangeModal]: aborting ${type} due to missing wallet`));
          Alert.alert('Unable to determine wallet address');
          return false;
        }

        // Switch to the flashbots provider if enabled
        // TODO(skylarbarrera): need to check if ledger and handle differently here
        if (flashbots && networkObject.features?.flashbots && wallet instanceof Wallet) {
			logger.debug('[ExchangeModal]: flashbots provider being set on mainnet');
			const flashbotsProvider = await getFlashbotsProvider();
          wallet = new Wallet(wallet.privateKey, flashbotsProvider);
        }

        if (!inputAmount || !outputAmount) {
          logger.error(new RainbowError(`[ExchangeModal]: aborting ${type} due to missing inputAmount or outputAmount`));
          Alert.alert('Input amount or output amount is missing');
          return false;
        }

        if (!tradeDetails) {
          logger.error(new RainbowError(`[ExchangeModal]: aborting ${type} due to missing tradeDetails`));
          Alert.alert('Missing trade details for swap');
          return false;
        }

        logger.debug(`[ExchangeModal]: getting nonce for account ${accountAddress}`);
        const currentNonce = await getNextNonce({ address: accountAddress, chainId: currentChainId });
        logger.debug(`[ExchangeModal]: nonce for account ${accountAddress} is ${currentNonce}`);
        const { independentField, independentValue, slippageInBips, source } = store.getState().swap;

        const transformedAssetToSell = {
          ...inputCurrency,
          chainName: getChainName({ chainId: inputCurrency.chainId as number }) as ChainName,
          address: inputCurrency.address as AddressOrEth,
          chainId: inputCurrency.chainId,
          colors: inputCurrency.colors as TokenColors,
        } as ParsedAsset;

        const transformedAssetToBuy = {
          ...outputCurrency,
          chainName: getChainName({ chainId: outputCurrency.chainId as number }) as ChainName,
          address: outputCurrency.address as AddressOrEth,
          chainId: outputCurrency.chainId,
          colors: outputCurrency.colors as TokenColors,
        } as ParsedAsset;

        const isWrapOrUnwrapEth = () => {
          return (
            isWrapNative({
              buyTokenAddress: tradeDetails?.buyTokenAddress,
              sellTokenAddress: tradeDetails?.sellTokenAddress,
              chainId: inputCurrency?.chainId || ChainId.mainnet,
            }) ||
            isUnwrapNative({
              buyTokenAddress: tradeDetails?.buyTokenAddress,
              sellTokenAddress: tradeDetails?.sellTokenAddress,
              chainId: inputCurrency?.chainId || ChainId.mainnet,
            })
          );
        };

        const { errorMessage } = await walletExecuteRap(wallet, isCrosschainSwap ? 'crosschainSwap' : 'swap', {
          chainId: currentChainId,
          flashbots,
          nonce: currentNonce,
          assetToSell: transformedAssetToSell,
          assetToBuy: transformedAssetToBuy,
          sellAmount: inputAmount,
          quote: {
            ...tradeDetails,
            feeInEth: isWrapOrUnwrapEth() ? '0' : tradeDetails.feeInEth,
            fromChainId: inputCurrency.chainId,
            toChainId: outputCurrency.chainId,
          },
          amount: inputAmount,
          meta: {
            inputAsset: transformedAssetToSell,
            outputAsset: transformedAssetToBuy,
            independentField: independentField as SwapModalField,
            independentValue: independentValue as string,
            slippage: slippageInBips,
            route: source,
          },
          gasParams: parseGasParamAmounts(selectedGasFee),
          gasFeeParamsBySpeed,
        });

        setIsAuthorizing(false);
        // if the transaction was not successful, we need to bubble that up to the caller
        if (errorMessage) {
          logger.error(new RainbowError(`[ExchangeModal]: transaction was not successful: ${errorMessage}`));
          if (wallet instanceof Wallet) {
            Alert.alert(errorMessage);
          } else {
            setHardwareTXError(true);
          }
          return false;
        }

        logger.debug('[ExchangeModal]: executed rap!');
        const slippage = slippageInBips / 100;
        analytics.track(`Completed ${type}`, {
          aggregator: tradeDetails?.source || '',
          amountInUSD,
          gasSetting: selectedGasFee?.option,
          inputTokenAddress: inputCurrency?.address || '',
          inputTokenName: inputCurrency?.name || '',
          inputTokenSymbol: inputCurrency?.symbol || '',
          isHardwareWallet,
          isHighPriceImpact: debouncedIsHighPriceImpact,
          legacyGasPrice: (selectedGasFee?.gasFeeParams as unknown as LegacyGasFeeParams)?.gasPrice?.amount || '',
          liquiditySources: JSON.stringify(tradeDetails?.protocols || []),
          maxNetworkFee: (selectedGasFee?.gasFee as GasFee)?.maxFee?.value?.amount || '',
          network: ethereumUtils.getNetworkFromChainId(currentChainId),
          networkFee: selectedGasFee?.gasFee?.estimatedFee?.value?.amount || '',
          outputTokenAddress: outputCurrency?.address || '',
          outputTokenName: outputCurrency?.name || '',
          outputTokenSymbol: outputCurrency?.symbol || '',
          priceImpact: priceImpact.percentDisplay,
          slippage: isNaN(slippage) ? 'Error calculating slippage.' : slippage,
          type,
        });
        // Tell iOS we finished running a rap (for tracking purposes)
        NotificationManager?.postNotification('rapCompleted');

        setTimeout(() => {
          if (isBridgeSwap) {
            handleReviewPromptAction(ReviewPromptAction.BridgeToL2);
          } else {
            handleReviewPromptAction(ReviewPromptAction.Swap);
          }
        }, 500);

        setParams({ focused: false });
        navigate(Routes.PROFILE_SCREEN);

        return true;
      } catch (error) {
        setIsAuthorizing(false);
        logger.error(new RainbowError(`[ExchangeModal]: error submitting swap: ${error}`));
        setParams({ focused: false });
        // close the hardware wallet modal before navigating
        if (isHardwareWallet) {
          goBack();
          await delay(100);
        }
        navigate(Routes.WALLET_SCREEN);
        return false;
      }
    },
    [
      accountAddress,
      currentChainId,
      debouncedIsHighPriceImpact,
      flashbots,
      gasFeeParamsBySpeed,
      goBack,
      inputAmount,
      inputCurrency,
      isBridgeSwap,
      isCrosschainSwap,
      isHardwareWallet,
      navigate,
      networkObject.features?.flashbots,
      outputAmount,
      outputCurrency,
      priceImpact.percentDisplay,
      selectedGasFee,
      setParams,
      tradeDetails,
      type,
    ]
  );

  const handleSubmit = useCallback(async () => {
    const amountInUSD = '0';
    const NotificationManager = ios ? NativeModules.NotificationManager : null;
    try {
      // Tell iOS we're running a rap (for tracking purposes)
      NotificationManager?.postNotification('rapInProgress');
    } catch (e) {
      logger.error(new RainbowError(`[ExchangeModal]: error posting notification for rapInProgress: ${e}`));
    } finally {
      const slippage = slippageInBips / 100;
      analytics.track(`Submitted ${type}`, {
        aggregator: tradeDetails?.source || '',
        gasSetting: selectedGasFee?.option,
        inputTokenAddress: inputCurrency?.address || '',
        inputTokenName: inputCurrency?.name || '',
        inputTokenSymbol: inputCurrency?.symbol || '',
        isHardwareWallet,
        isHighPriceImpact: debouncedIsHighPriceImpact,
        legacyGasPrice: (selectedGasFee?.gasFeeParams as unknown as LegacyGasFeeParams)?.gasPrice?.amount || '',
        liquiditySources: JSON.stringify(tradeDetails?.protocols || []),
        maxNetworkFee: (selectedGasFee?.gasFee as GasFee)?.maxFee?.value?.amount || '',
        network: ethereumUtils.getNetworkFromChainId(currentChainId),
        networkFee: selectedGasFee?.gasFee?.estimatedFee?.value?.amount || '',
        outputTokenAddress: outputCurrency?.address || '',
        outputTokenName: outputCurrency?.name || '',
        outputTokenSymbol: outputCurrency?.symbol || '',
        priceImpact: priceImpact.percentDisplay,
        slippage: isNaN(slippage) ? 'Error caclulating slippage.' : slippage,
        type,
      });
    }

    const outputInUSD = outputNativeAmount;
    const gasPrice =
      (selectedGasFee?.gasFee as GasFee)?.maxFee?.native?.value?.amount ||
      (selectedGasFee?.gasFee as LegacyGasFee)?.estimatedFee?.native?.value?.amount;
    const cancelTransaction = await checkGasVsOutput(gasPrice, outputInUSD);

    if (cancelTransaction) {
      return false;
    }
    try {
      return await submit(amountInUSD);
    } catch (e) {
      return false;
    }
  }, [
    outputNativeAmount,
    selectedGasFee?.gasFee,
    selectedGasFee?.option,
    selectedGasFee?.gasFeeParams,
    slippageInBips,
    type,
    tradeDetails?.source,
    tradeDetails?.protocols,
    inputCurrency?.address,
    inputCurrency?.name,
    inputCurrency?.symbol,
    isHardwareWallet,
    debouncedIsHighPriceImpact,
    currentChainId,
    outputCurrency?.address,
    outputCurrency?.name,
    outputCurrency?.symbol,
    priceImpact.percentDisplay,
    submit,
  ]);

  const confirmButtonProps = useMemoOne(
    () => ({
      chainId: currentChainId,
      disabled: !Number(inputAmount) || (!loading && !tradeDetails),
      inputAmount,
      isAuthorizing,
      isHighPriceImpact: debouncedIsHighPriceImpact,
      isSufficientBalance,
      loading,
      onSubmit: handleSubmit,
      isHardwareWallet,
      quoteError,
      tradeDetails,
      type,
      isBridgeSwap,
    }),
    [
      loading,
      handleSubmit,
      inputAmount,
      isAuthorizing,
      debouncedIsHighPriceImpact,
      testID,
      tradeDetails,
      type,
      quoteError,
      isSufficientBalance,
      isBridgeSwap,
    ]
  );

  const navigateToSwapSettingsSheet = useCallback(() => {
    android && Keyboard.dismiss();
    const lastFocusedInputHandleTemporary = lastFocusedInputHandle.current;
    android && (lastFocusedInputHandle.current = null);
    inputFieldRef?.current?.blur();
    outputFieldRef?.current?.blur();
    nativeFieldRef?.current?.blur();
    const internalNavigate = () => {
      delayNext();
      IS_ANDROID && keyboardListenerSubscription.current?.remove();
      setParams({ focused: false });
      navigate(Routes.SWAP_SETTINGS_SHEET, {
        asset: outputCurrency,
        chainId: currentChainId,
        restoreFocusOnSwapModal: () => {
          android && (lastFocusedInputHandle.current = lastFocusedInputHandleTemporary);
          setParams({ focused: true });
        },
        swapSupportsFlashbots,
        type: 'swap_settings',
      });
      analytics.track('Opened Swap Settings');
    };
    if (IS_IOS || !isKeyboardOpen()) {
      internalNavigate();
    } else {
      keyboardListenerSubscription.current = Keyboard.addListener('keyboardDidHide', internalNavigate);
    }
  }, [
    lastFocusedInputHandle,
    inputFieldRef,
    outputFieldRef,
    nativeFieldRef,
    setParams,
    navigate,
    outputCurrency,
    currentChainId,
    swapSupportsFlashbots,
  ]);

  const navigateToSwapDetailsModal = useCallback(
    (isRefuelTx = false) => {
      android && Keyboard.dismiss();
      const lastFocusedInputHandleTemporary = lastFocusedInputHandle.current;
      android && (lastFocusedInputHandle.current = null);
      inputFieldRef?.current?.blur?.();
      outputFieldRef?.current?.blur?.();
      nativeFieldRef?.current?.blur?.();
      const internalNavigate = () => {
        IS_ANDROID && keyboardListenerSubscription.current?.remove();
        setParams({ focused: false });
        navigate(Routes.SWAP_DETAILS_SHEET, {
          confirmButtonProps,
          currentNetwork: ethereumUtils.getNetworkFromChainId(currentChainId),
          flashbotTransaction: flashbots,
          isRefuelTx,
          restoreFocusOnSwapModal: () => {
            android && (lastFocusedInputHandle.current = lastFocusedInputHandleTemporary);
            setParams({ focused: true });
          },
          type: 'swap_details',
        });
        analytics.track('Opened Swap Details modal', {
          inputTokenAddress: inputCurrency?.address || '',
          inputTokenName: inputCurrency?.name || '',
          inputTokenSymbol: inputCurrency?.symbol || '',
          outputTokenAddress: outputCurrency?.address || '',
          outputTokenName: outputCurrency?.name || '',
          outputTokenSymbol: outputCurrency?.symbol || '',
          type,
        });
      };
      if (IS_IOS || !isKeyboardOpen()) {
        internalNavigate();
      } else {
        keyboardListenerSubscription.current = Keyboard.addListener('keyboardDidHide', internalNavigate);
      }
    },
    [
      confirmButtonProps,
      currentChainId,
      flashbots,
      inputCurrency?.address,
      inputCurrency?.name,
      inputCurrency?.symbol,
      inputFieldRef,
      lastFocusedInputHandle,
      nativeFieldRef,
      navigate,
      outputCurrency?.address,
      outputCurrency?.name,
      outputCurrency?.symbol,
      outputFieldRef,
      setParams,
      type,
    ]
  );

  const handleTapWhileDisabled = useCallback(() => {
    const lastFocusedInput = lastFocusedInputHandle?.current as unknown as TextInput;
    lastFocusedInput?.blur();
    navigate(Routes.EXPLAIN_SHEET, {
      inputToken: inputCurrency?.symbol,
      fromChainId: inputChainId,
      toChainId: outputChainId,
      isCrosschainSwap,
      isBridgeSwap,
      onClose: () => {
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            lastFocusedInput?.focus();
          }, 250);
        });
      },
      outputToken: outputCurrency?.symbol,
      type: 'output_disabled',
    });
  }, [
    inputCurrency?.symbol,
    inputChainId,
    isBridgeSwap,
    isCrosschainSwap,
    lastFocusedInputHandle,
    navigate,
    outputCurrency?.symbol,
    outputChainId,
  ]);

  const showConfirmButton = !!inputCurrency && !!outputCurrency;

  const handleConfirmExchangePress = useCallback(() => {
    if (loading) return NOOP();

    return navigateToSwapDetailsModal();
  }, [loading, navigateToSwapDetailsModal]);

  return (
    <Wrapper keyboardType={KeyboardType.numpad}>
      <Box height="full" width="full">
        <View style={{ flexGrow: 1, justifyContent: 'center', width: '100%' }}>
          <FloatingPanels>
            <>
              <FloatingPanel
                borderRadius={39}
                overflow="visible"
                paddingBottom={{ custom: 0 }}
                style={{
                  ...(android && {
                    left: -1,
                  }),
                }}
                testID={testID}
              >
                <ExchangeNotch testID={testID} />
                <ExchangeHeader testID={testID} title={title} />
                <ExchangeInputField
                  color={inputCurrencyColor}
                  chainId={inputChainId}
                  disableInputCurrencySelection={false}
                  editable={!!inputCurrency}
                  inputAmount={inputAmountDisplay}
                  inputCurrencyAddress={inputCurrency?.address}
                  inputCurrencyMainnetAddress={inputCurrency?.mainnet_address}
                  inputCurrencySymbol={inputCurrency?.symbol}
                  inputFieldRef={inputFieldRef}
                  inputCurrencyIcon={inputCurrency?.icon_url}
                  inputCurrencyColors={inputCurrency?.colors}
                  loading={loading}
                  nativeAmount={nativeAmountDisplay}
                  nativeCurrency={nativeCurrency}
                  nativeFieldRef={nativeFieldRef}
                  onFocus={handleFocus}
                  onPressMaxBalance={updateMaxInputAmount}
                  onPressSelectInputCurrency={chainId => {
                    navigateToSelectInputCurrency(chainId);
                  }}
                  setInputAmount={updateInputAmount}
                  setNativeAmount={updateNativeAmount}
                  testID={`${testID}-input`}
                  updateAmountOnFocus={maxInputUpdate || flipCurrenciesUpdate || isFillingParams}
                />
                <ExchangeOutputField
                  color={outputCurrencyColor}
                  editable={!!outputCurrency && !isCrosschainSwap}
                  chainId={outputChainId}
                  onFocus={handleFocus}
                  onPressSelectOutputCurrency={() => {
                    navigateToSelectOutputCurrency(currentChainId);
                  }}
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...(isCrosschainSwap &&
                    !!outputCurrency && {
                      onTapWhileDisabled: handleTapWhileDisabled,
                    })}
                  loading={loading}
                  outputAmount={outputAmountDisplay}
                  outputCurrencyAddress={outputCurrency?.address}
                  outputCurrencyIcon={outputCurrency?.icon_url}
                  outputCurrencyColors={outputCurrency?.colors}
                  outputCurrencyMainnetAddress={outputCurrency?.mainnet_address}
                  outputCurrencySymbol={outputCurrency?.symbol}
                  outputFieldRef={outputFieldRef}
                  setOutputAmount={updateOutputAmount}
                  testID={`${testID}-output`}
                  updateAmountOnFocus={maxInputUpdate || flipCurrenciesUpdate || isFillingParams}
                />
              </FloatingPanel>
              {showConfirmButton && (
                <ExchangeDetailsRow
                  isHighPriceImpact={
                    !confirmButtonProps.disabled && !confirmButtonProps.loading && debouncedIsHighPriceImpact && isSufficientBalance
                  }
                  outputCurrencySymbol={outputCurrency?.symbol}
                  onFlipCurrencies={loading ? NOOP : flipCurrencies}
                  onPressImpactWarning={navigateToSwapDetailsModal}
                  onPressSettings={navigateToSwapSettingsSheet}
                  priceImpactColor={priceImpact.color}
                  priceImpactNativeAmount={priceImpact.impactDisplay}
                  priceImpactPercentDisplay={priceImpact.percentDisplay}
                  type={type}
                />
              )}
            </>
          </FloatingPanels>
        </View>

        <Box>
          <Rows alignVertical="bottom" space="19px (Deprecated)">
            <Row height="content">
              {showConfirmButton && (
                <ConfirmExchangeButton
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...confirmButtonProps}
                  onPressViewDetails={handleConfirmExchangePress}
                  testID={`${testID}-confirm-button`}
                />
              )}
            </Row>
            <Row height="content">
              {/* @ts-expect-error - Javascript Component */}
              <GasSpeedButton
                asset={outputCurrency}
                chainId={currentChainId}
                flashbotTransaction={flashbots}
                marginBottom={0}
                marginTop={0}
                testID={`${testID}-gas`}
                crossChainServiceTime={getCrosschainSwapServiceTime(tradeDetails as CrosschainQuote)}
              />
            </Row>
          </Rows>
        </Box>
      </Box>
    </Wrapper>
  );
}
