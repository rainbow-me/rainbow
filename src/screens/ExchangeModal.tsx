import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import { isEmpty, isEqual } from 'lodash';
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import equal from 'react-fast-compare';
import {
  InteractionManager,
  Keyboard,
  NativeModules,
  TextInput,
} from 'react-native';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { useDispatch, useSelector } from 'react-redux';
import { useDebounce } from 'use-debounce/lib';
import { useMemoOne } from 'use-memo-one';
import { dismissingScreenListener } from '../../shim';
import {
  AnimatedExchangeFloatingPanels,
  ConfirmExchangeButton,
  DepositInfo,
  ExchangeDetailsRow,
  ExchangeHeader,
  ExchangeInputField,
  ExchangeNotch,
  ExchangeOutputField,
} from '../components/exchange';
import { FloatingPanel } from '../components/floating-panels';
import { GasSpeedButton } from '../components/gas';
import { KeyboardFixedOpenLayout } from '../components/layout';
import { delayNext } from '../hooks/useMagicAutofocus';
import config from '../model/config';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@/analytics';
import { Box, Row, Rows } from '@/design-system';
import {
  AssetType,
  GasFee,
  LegacyGasFee,
  LegacyGasFeeParams,
  ParsedAddressAsset,
  SwappableAsset,
} from '@/entities';
import { ExchangeModalTypes, isKeyboardOpen, Network } from '@/helpers';
import { KeyboardType } from '@/helpers/keyboardTypes';
import { getProviderForNetwork, getHasMerged } from '@/handlers/web3';
import {
  divide,
  fromWei,
  greaterThan,
  multiply,
  subtract,
} from '@/helpers/utilities';
import {
  useAccountSettings,
  useCurrentNonce,
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
} from '@/hooks';
import { loadWallet } from '@/model/wallet';
import { useNavigation } from '@/navigation';
import {
  executeRap,
  getSwapRapEstimationByType,
  getSwapRapTypeByExchangeType,
} from '@/raps';
import {
  swapClearState,
  SwapModalField,
  TypeSpecificParameters,
  updateSwapSlippage,
  updateSwapTypeDetails,
} from '@/redux/swap';
import { ETH_ADDRESS, ethUnits } from '@/references';
import Routes from '@/navigation/routesNames';
import { ethereumUtils, gasUtils } from '@/utils';
import { useEthUSDPrice } from '@/utils/ethereumUtils';
import { IS_ANDROID, IS_TEST } from '@/env';
import logger from '@/utils/logger';
import {
  CrosschainSwapActionParameters,
  SwapActionParameters,
} from '@/raps/common';
import { CROSSCHAIN_SWAPS, useExperimentalFlag } from '@/config';
import useSwapRefuel, { RefuelState } from '@/hooks/useSwapRefuel';
import networkInfo from '@/helpers/networkInfo';
import { CrosschainQuote, Quote } from '@rainbow-me/swaps';
import store from '@/redux/store';
import { getCrosschainSwapServiceTime } from '@/handlers/swap';
import useParamsForExchangeModal from '@/hooks/useParamsForExchangeModal';

export const DEFAULT_SLIPPAGE_BIPS = {
  [Network.mainnet]: 100,
  [Network.polygon]: 200,
  [Network.bsc]: 200,
  [Network.optimism]: 200,
  [Network.arbitrum]: 200,
  [Network.goerli]: 100,
  [Network.bsc]: 200,
};

export const getDefaultSlippageFromConfig = (network: Network) => {
  const configSlippage = (config.default_slippage_bips as unknown) as {
    [network: string]: number;
  };
  const slippage =
    configSlippage?.[network] ?? DEFAULT_SLIPPAGE_BIPS[network] ?? 100;
  return slippage;
};
const NOOP = () => null;

const FloatingPanels = AnimatedExchangeFloatingPanels;

const Wrapper = KeyboardFixedOpenLayout;

const getInputHeaderTitle = (
  type: keyof typeof ExchangeModalTypes,
  defaultInputAsset: SwappableAsset
) => {
  switch (type) {
    case ExchangeModalTypes.deposit:
      return lang.t('swap.modal_types.deposit');
    case ExchangeModalTypes.withdrawal:
      return lang.t('swap.modal_types.withdraw_symbol', {
        symbol: defaultInputAsset.symbol,
      });
    default:
      return lang.t('swap.modal_types.swap');
  }
};

const getShowOutputField = (type: keyof typeof ExchangeModalTypes) => {
  switch (type) {
    case ExchangeModalTypes.deposit:
    case ExchangeModalTypes.withdrawal:
      return false;
    default:
      return true;
  }
};

interface ExchangeModalProps {
  fromDiscover: boolean;
  ignoreInitialTypeCheck?: boolean;
  testID: string;
  type: keyof typeof ExchangeModalTypes;
  typeSpecificParams: TypeSpecificParameters;
}

export default function ExchangeModal({
  fromDiscover,
  ignoreInitialTypeCheck,
  testID,
  type,
  typeSpecificParams,
}: ExchangeModalProps) {
  const dispatch = useDispatch();
  const {
    slippageInBips,
    maxInputUpdate,
    flipCurrenciesUpdate,
  } = useSwapSettings();
  const {
    params: { inputAsset: defaultInputAsset, outputAsset: defaultOutputAsset },
  } = useRoute<{
    key: string;
    name: string;
    params: { inputAsset: SwappableAsset; outputAsset: SwappableAsset };
  }>();

  const crosschainSwapsEnabled = useExperimentalFlag(CROSSCHAIN_SWAPS);

  useLayoutEffect(() => {
    dispatch(updateSwapTypeDetails(type, typeSpecificParams));
  }, [dispatch, type, typeSpecificParams]);

  const title = getInputHeaderTitle(type, defaultInputAsset);
  const showOutputField = getShowOutputField(type);
  const priceOfEther = useEthUSDPrice();
  const [
    outputNetworkDetails,
    setOutputNetworkDetails,
  ] = useState<ParsedAddressAsset>();
  const genericAssets = useSelector<
    { data: { genericAssets: { [address: string]: SwappableAsset } } },
    { [address: string]: SwappableAsset }
  >(({ data: { genericAssets } }) => genericAssets);
  const [hasDeductedRefuel, setHasDeductedRefuel] = useState(false);
  const {
    navigate,
    setParams,
    dangerouslyGetParent,
    addListener,
  } = useNavigation();

  const isDeposit = type === ExchangeModalTypes.deposit;
  const isWithdrawal = type === ExchangeModalTypes.withdrawal;
  const isSavings = isDeposit || isWithdrawal;
  const {
    selectedGasFee,
    gasFeeParamsBySpeed,
    startPollingGasFees,
    stopPollingGasFees,
    updateDefaultGasLimit,
    updateGasFeeOption,
    updateTxFee,
    txNetwork,
    isGasReady,
  } = useGas();
  const {
    accountAddress,
    flashbotsEnabled,
    nativeCurrency,
  } = useAccountSettings();

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const prevGasFeesParamsBySpeed = usePrevious(gasFeeParamsBySpeed);
  const prevTxNetwork = usePrevious(txNetwork);

  useAndroidBackHandler(() => {
    navigate(Routes.WALLET_SCREEN);
    return true;
  });

  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const {
    handleFocus,
    inputFieldRef,
    lastFocusedInputHandle,
    setLastFocusedInputHandle,
    nativeFieldRef,
    outputFieldRef,
  } = useSwapInputRefs();

  const {
    updateInputAmount,
    updateMaxInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  } = useSwapInputHandlers();

  const {
    inputNetwork,
    outputNetwork,
    chainId,
    currentNetwork,
    isCrosschainSwap,
    isBridgeSwap,
  } = useMemo(() => {
    const inputNetwork = ethereumUtils.getNetworkFromType(inputCurrency?.type);
    const outputNetwork = ethereumUtils.getNetworkFromType(
      outputCurrency?.type
    );
    const chainId =
      inputCurrency?.type || outputCurrency?.type
        ? ethereumUtils.getChainIdFromType(
            inputCurrency?.type ?? outputCurrency?.type
          )
        : 1;

    const currentNetwork = ethereumUtils.getNetworkFromChainId(chainId);
    const isCrosschainSwap =
      crosschainSwapsEnabled && inputNetwork !== outputNetwork;
    const isBridgeSwap = inputCurrency?.symbol === outputCurrency?.symbol;
    return {
      inputNetwork,
      outputNetwork,
      chainId,
      currentNetwork,
      isCrosschainSwap,
      isBridgeSwap,
    };
  }, [
    crosschainSwapsEnabled,
    inputCurrency?.symbol,
    inputCurrency?.type,
    outputCurrency?.symbol,
    outputCurrency?.type,
  ]);

  // if the default input is on a different network than
  // we want to update the output to be on the same, if its not available -> null
  const defaultOutputAssetOverride = useMemo(() => {
    const newOutput = defaultOutputAsset;

    if (
      defaultInputAsset &&
      defaultOutputAsset &&
      defaultInputAsset.type !== defaultOutputAsset.type
    ) {
      // find address for output asset on the input's network
      // TODO: this value can be removed after the crosschain swaps flag is no longer necessary
      const inputNetworkImplementationAddress =
        defaultOutputAsset?.implementations?.[
          defaultInputAsset?.type === AssetType.token
            ? 'ethereum'
            : defaultInputAsset?.type
        ]?.address;
      if (inputNetworkImplementationAddress || crosschainSwapsEnabled) {
        if (!crosschainSwapsEnabled) {
          newOutput.address =
            inputNetworkImplementationAddress || defaultOutputAsset.address;
          if (defaultInputAsset.type !== Network.mainnet) {
            newOutput.mainnet_address = defaultOutputAsset.address;
          }
          newOutput.type = defaultInputAsset.type;
        }
        newOutput.uniqueId =
          newOutput.type === Network.mainnet
            ? defaultOutputAsset?.address
            : `${defaultOutputAsset?.address}_${defaultOutputAsset?.type}`;
        return newOutput;
      } else {
        return null;
      }
    } else {
      return newOutput;
    }
  }, [defaultInputAsset, defaultOutputAsset, crosschainSwapsEnabled]);

  const {
    flipCurrencies,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    updateAndFocusInputAmount,
  } = useSwapCurrencyHandlers({
    currentNetwork,
    inputNetwork,
    outputNetwork,
    defaultInputAsset,
    defaultOutputAsset: defaultOutputAssetOverride,
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

  useEffect(() => {
    if (
      !speedUrgentSelected.current &&
      !isEmpty(gasFeeParamsBySpeed) &&
      (currentNetwork === Network.mainnet || currentNetwork === Network.polygon)
    ) {
      // Default to fast for networks with speed options
      updateGasFeeOption(gasUtils.FAST);
      speedUrgentSelected.current = true;
    }
  }, [
    currentNetwork,
    gasFeeParamsBySpeed,
    selectedGasFee,
    updateGasFeeOption,
    updateTxFee,
  ]);

  useEffect(() => {
    if (currentNetwork !== prevTxNetwork) {
      speedUrgentSelected.current = false;
    }
  }, [currentNetwork, prevTxNetwork]);

  useEffect(() => {
    const getNativeOutputAsset = async () => {
      if (!outputNetwork || !accountAddress) return;
      const nativeAsset = await ethereumUtils.getNativeAssetForNetwork(
        outputNetwork,
        accountAddress
      );
      setOutputNetworkDetails(nativeAsset);
    };
    getNativeOutputAsset();
  }, [outputNetwork, accountAddress]);

  const defaultGasLimit = useMemo(() => {
    const basicSwap = ethereumUtils.getBasicSwapGasLimit(Number(chainId));
    if (isDeposit) return ethUnits.basic_deposit;
    return isWithdrawal ? ethUnits.basic_withdrawal : basicSwap;
  }, [chainId, isDeposit, isWithdrawal]);

  const getNextNonce = useCurrentNonce(accountAddress, currentNetwork);

  const {
    result: {
      derivedValues: { inputAmount, nativeAmount, outputAmount },
      displayValues: {
        inputAmountDisplay,
        outputAmountDisplay,
        nativeAmountDisplay,
      },
      tradeDetails,
    },
    loading,
    resetSwapInputs,
    setRefuel,
    quoteError,
  } = useSwapDerivedOutputs(type);

  const lastTradeDetails = usePrevious(tradeDetails);
  const isSufficientBalance = useSwapIsSufficientBalance(inputAmount);

  const {
    isHighPriceImpact,
    outputPriceValue,
    priceImpactColor,
    priceImpactNativeAmount,
    priceImpactPercentDisplay,
  } = usePriceImpactDetails(
    inputAmount,
    outputAmount,
    inputCurrency,
    outputCurrency,
    currentNetwork,
    loading
  );
  const [debouncedIsHighPriceImpact] = useDebounce(isHighPriceImpact, 1000);
  // For a limited period after the merge we need to block the use of flashbots.
  // This line should be removed after reenabling flashbots in remote config.
  const hideFlashbotsPostMerge =
    getHasMerged(currentNetwork) && !config.flashbots_enabled;
  const swapSupportsFlashbots =
    currentNetwork === Network.mainnet && !hideFlashbotsPostMerge;
  const flashbots = swapSupportsFlashbots && flashbotsEnabled;

  const isDismissing = useRef(false);
  useEffect(() => {
    if (ios) {
      return;
    }
    ((dismissingScreenListener.current as unknown) as () => void) = () => {
      Keyboard.dismiss();
      isDismissing.current = true;
    };
    const unsubscribe = (
      dangerouslyGetParent()?.dangerouslyGetParent()?.addListener || addListener
    )(
      // @ts-expect-error - Not sure if this is even triggered as React Navigation apparently doesnt emit this event.
      'transitionEnd',
      // @ts-expect-error - Can't find any docs around this closing prop being sent is this a private API?
      ({ data: { closing } }) => {
        if (!closing && isDismissing.current) {
          isDismissing.current = false;
          ((lastFocusedInputHandle as unknown) as MutableRefObject<TextInput>)?.current?.focus();
        }
      }
    );
    return () => {
      unsubscribe();
      dismissingScreenListener.current = undefined;
    };
  }, [addListener, dangerouslyGetParent, lastFocusedInputHandle]);

  useEffect(() => {
    let slippage = DEFAULT_SLIPPAGE_BIPS?.[currentNetwork];
    const configSlippage = (config.default_slippage_bips as unknown) as {
      [network: string]: number;
    };
    if (configSlippage?.[currentNetwork]) {
      slippage = configSlippage?.[currentNetwork];
    }
    slippage && dispatch(updateSwapSlippage(slippage));
  }, [currentNetwork, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(swapClearState());
      resetSwapInputs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateGasLimit = useCallback(async () => {
    try {
      const provider = await getProviderForNetwork(currentNetwork);
      const swapParams:
        | SwapActionParameters
        | CrosschainSwapActionParameters = {
        chainId,
        inputAmount: inputAmount!,
        outputAmount: outputAmount!,
        provider,
        tradeDetails: tradeDetails!,
      };

      const rapType = getSwapRapTypeByExchangeType(type, isCrosschainSwap);
      const gasLimit = await getSwapRapEstimationByType(rapType, swapParams);
      if (gasLimit) {
        if (currentNetwork === Network.optimism) {
          if (tradeDetails) {
            const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(
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
            updateTxFee(
              gasLimit,
              null,
              ethUnits.default_l1_gas_fee_optimism_swap
            );
          }
        } else {
          updateTxFee(gasLimit, null);
        }
      }
    } catch (error) {
      updateTxFee(defaultGasLimit, null);
    }
  }, [
    chainId,
    currentNetwork,
    defaultGasLimit,
    inputAmount,
    isCrosschainSwap,
    outputAmount,
    tradeDetails,
    type,
    updateTxFee,
  ]);

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
  }, [
    defaultGasLimit,
    gasFeeParamsBySpeed,
    prevGasFeesParamsBySpeed,
    updateTxFee,
  ]);

  // Update gas limit
  useEffect(() => {
    if (
      !isGasReady ||
      (!prevTxNetwork && txNetwork !== prevTxNetwork) ||
      (!isEmpty(gasFeeParamsBySpeed) &&
        !isEqual(gasFeeParamsBySpeed, prevGasFeesParamsBySpeed))
    ) {
      updateGasLimit();
    }
  }, [
    gasFeeParamsBySpeed,
    isGasReady,
    prevGasFeesParamsBySpeed,
    prevTxNetwork,
    txNetwork,
    updateGasLimit,
  ]);

  // Listen to gas prices, Uniswap reserves updates
  useEffect(() => {
    updateDefaultGasLimit(defaultGasLimit);
    InteractionManager.runAfterInteractions(() => {
      // Start polling in the current network
      startPollingGasFees(currentNetwork, flashbots);
    });
    return () => {
      stopPollingGasFees();
    };
  }, [
    defaultGasLimit,
    currentNetwork,
    startPollingGasFees,
    stopPollingGasFees,
    updateDefaultGasLimit,
    flashbots,
  ]);

  const checkGasVsOutput = async (gasPrice: string, outputPrice: string) => {
    if (
      greaterThan(outputPrice, 0) &&
      greaterThan(gasPrice, outputPrice) &&
      !(IS_ANDROID && IS_TEST)
    ) {
      const res = new Promise(resolve => {
        Alert.alert(
          lang.t('swap.warning.cost.are_you_sure_title'),
          lang.t('swap.warning.cost.this_transaction_will_cost_you_more'),
          [
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
          ]
        );
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
    async amountInUSD => {
      setIsAuthorizing(true);
      const NotificationManager = ios
        ? NativeModules.NotificationManager
        : null;
      try {
        const wallet = await loadWallet();
        if (!wallet) {
          setIsAuthorizing(false);
          logger.sentry(`aborting ${type} due to missing wallet`);
          return false;
        }

        const callback = (
          success = false,
          errorMessage: string | null = null
        ) => {
          setIsAuthorizing(false);
          if (success) {
            setParams({ focused: false });
            navigate(Routes.PROFILE_SCREEN);
          } else if (errorMessage) {
            Alert.alert(errorMessage);
          }
        };
        logger.log('[exchange - handle submit] rap');
        const nonce = await getNextNonce();
        const {
          independentField,
          independentValue,
          slippageInBips,
          source,
        } = store.getState().swap;
        const swapParameters = {
          chainId,
          flashbots,
          inputAmount: inputAmount!,
          outputAmount: outputAmount!,
          nonce,
          tradeDetails: {
            ...tradeDetails,
            fromChainId: ethereumUtils.getChainIdFromType(inputCurrency?.type),
            toChainId: ethereumUtils.getChainIdFromType(outputCurrency?.type),
          } as Quote | CrosschainQuote,
          meta: {
            flashbots,
            inputAsset: inputCurrency,
            outputAsset: outputCurrency,
            independentField: independentField as SwapModalField,
            independentValue: independentValue as string,
            slippage: slippageInBips,
            route: source,
          },
        };

        const rapType = getSwapRapTypeByExchangeType(type, isCrosschainSwap);
        await executeRap(wallet, rapType, swapParameters, callback);
        logger.log('[exchange - handle submit] executed rap!');
        const slippage = slippageInBips / 100;
        analytics.track(`Completed ${type}`, {
          aggregator: tradeDetails?.source || '',
          amountInUSD,
          gasSetting: selectedGasFee?.option,
          inputTokenAddress: inputCurrency?.address || '',
          inputTokenName: inputCurrency?.name || '',
          inputTokenSymbol: inputCurrency?.symbol || '',
          isHighPriceImpact: debouncedIsHighPriceImpact,
          legacyGasPrice:
            ((selectedGasFee?.gasFeeParams as unknown) as LegacyGasFeeParams)
              ?.gasPrice?.amount || '',
          liquiditySources: JSON.stringify(tradeDetails?.protocols || []),
          maxNetworkFee:
            (selectedGasFee?.gasFee as GasFee)?.maxFee?.value?.amount || '',
          network: currentNetwork,
          networkFee: selectedGasFee?.gasFee?.estimatedFee?.value?.amount || '',
          outputTokenAddress: outputCurrency?.address || '',
          outputTokenName: outputCurrency?.name || '',
          outputTokenSymbol: outputCurrency?.symbol || '',
          priceImpact: priceImpactPercentDisplay,
          slippage: isNaN(slippage) ? 'Error calculating slippage.' : slippage,
          type,
        });
        // Tell iOS we finished running a rap (for tracking purposes)
        NotificationManager?.postNotification('rapCompleted');
        return true;
      } catch (error) {
        setIsAuthorizing(false);
        logger.log('[exchange - handle submit] error submitting swap', error);
        setParams({ focused: false });
        navigate(Routes.WALLET_SCREEN);
        return false;
      }
    },
    [
      chainId,
      currentNetwork,
      debouncedIsHighPriceImpact,
      flashbots,
      getNextNonce,
      inputAmount,
      inputCurrency,
      isCrosschainSwap,
      navigate,
      outputAmount,
      outputCurrency,
      priceImpactPercentDisplay,
      selectedGasFee?.gasFee,
      selectedGasFee?.gasFeeParams,
      selectedGasFee?.option,
      setParams,
      tradeDetails,
      type,
    ]
  );

  const handleSubmit = useCallback(async () => {
    let amountInUSD = '0';
    const NotificationManager = ios ? NativeModules.NotificationManager : null;
    try {
      // Tell iOS we're running a rap (for tracking purposes)
      NotificationManager?.postNotification('rapInProgress');
      if (nativeCurrency.toLowerCase() === 'usd') {
        amountInUSD = nativeAmount!;
      } else {
        const ethPriceInNativeCurrency =
          genericAssets[ETH_ADDRESS]?.price?.value ?? 0;
        const inputTokenPriceInNativeCurrency =
          genericAssets[inputCurrency?.address]?.price?.value ?? 0;
        const outputTokenPriceInNativeCurrency =
          genericAssets[outputCurrency?.address]?.price?.value ?? 0;
        const inputTokensPerEth = divide(
          inputTokenPriceInNativeCurrency,
          ethPriceInNativeCurrency
        );
        const outputTokensPerEth = divide(
          outputTokenPriceInNativeCurrency,
          ethPriceInNativeCurrency
        );
        const inputTokensInEth = multiply(inputTokensPerEth, inputAmount!);
        const outputTokensInEth = multiply(outputTokensPerEth, outputAmount!);

        const availableTokenPrice = inputTokensInEth ?? outputTokensInEth;
        const maybeResultAmount = multiply(priceOfEther, availableTokenPrice);
        // We have to use string matching here because the multiply helper will return the value as a string from the helpers
        // If we pass a empty string value to segment it gets ignored
        amountInUSD = ['NaN', '0'].includes(maybeResultAmount)
          ? ''
          : maybeResultAmount;
      }
    } catch (e) {
      logger.log('error getting the swap amount in USD price', e);
    } finally {
      const slippage = slippageInBips / 100;
      analytics.track(`Submitted ${type}`, {
        aggregator: tradeDetails?.source || '',
        amountInUSD,
        gasSetting: selectedGasFee?.option,
        inputTokenAddress: inputCurrency?.address || '',
        inputTokenName: inputCurrency?.name || '',
        inputTokenSymbol: inputCurrency?.symbol || '',
        isHighPriceImpact: debouncedIsHighPriceImpact,
        legacyGasPrice:
          ((selectedGasFee?.gasFeeParams as unknown) as LegacyGasFeeParams)
            ?.gasPrice?.amount || '',
        liquiditySources: JSON.stringify(tradeDetails?.protocols || []),
        maxNetworkFee:
          (selectedGasFee?.gasFee as GasFee)?.maxFee?.value?.amount || '',
        network: currentNetwork,
        networkFee: selectedGasFee?.gasFee?.estimatedFee?.value?.amount || '',
        outputTokenAddress: outputCurrency?.address || '',
        outputTokenName: outputCurrency?.name || '',
        outputTokenSymbol: outputCurrency?.symbol || '',
        priceImpact: priceImpactPercentDisplay,
        slippage: isNaN(slippage) ? 'Error caclulating slippage.' : slippage,
        type,
      });
    }

    const outputInUSD = multiply(outputPriceValue!, outputAmount!);
    const gasPrice =
      (selectedGasFee?.gasFee as GasFee)?.maxFee?.native?.value?.amount ||
      (selectedGasFee?.gasFee as LegacyGasFee)?.estimatedFee?.native?.value
        ?.amount;
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
    outputPriceValue,
    outputAmount,
    selectedGasFee,
    submit,
    nativeCurrency,
    nativeAmount,
    genericAssets,
    inputCurrency?.address,
    inputCurrency?.name,
    inputCurrency?.symbol,
    inputAmount,
    priceOfEther,
    slippageInBips,
    type,
    tradeDetails?.source,
    tradeDetails?.protocols,
    debouncedIsHighPriceImpact,
    currentNetwork,
    outputCurrency?.address,
    outputCurrency?.name,
    outputCurrency?.symbol,
    priceImpactPercentDisplay,
  ]);

  const confirmButtonProps = useMemoOne(
    () => ({
      currentNetwork,
      disabled:
        !Number(inputAmount) || (!loading && !tradeDetails && !isSavings),
      inputAmount,
      isAuthorizing,
      isHighPriceImpact: debouncedIsHighPriceImpact,
      isSufficientBalance,
      loading,
      onSubmit: handleSubmit,
      quoteError,
      tradeDetails,
      type,
      isBridgeSwap,
    }),
    [
      currentNetwork,
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
      android && Keyboard.removeListener('keyboardDidHide', internalNavigate);
      setParams({ focused: false });
      navigate(Routes.SWAP_SETTINGS_SHEET, {
        asset: outputCurrency,
        network: currentNetwork,
        restoreFocusOnSwapModal: () => {
          android &&
            (lastFocusedInputHandle.current = lastFocusedInputHandleTemporary);
          setParams({ focused: true });
        },
        swapSupportsFlashbots,
        type: 'swap_settings',
      });
      analytics.track('Opened Swap Settings');
    };
    ios || !isKeyboardOpen()
      ? internalNavigate()
      : Keyboard.addListener('keyboardDidHide', internalNavigate);
  }, [
    lastFocusedInputHandle,
    inputFieldRef,
    outputFieldRef,
    nativeFieldRef,
    setParams,
    navigate,
    outputCurrency,
    currentNetwork,
    swapSupportsFlashbots,
  ]);

  const resetRefuelState = useCallback(() => {
    setHasDeductedRefuel(false);
    setRefuel(false);
  }, [setRefuel]);

  const navigateToSwapDetailsModal = useCallback(
    (isRefuelTx = false) => {
      android && Keyboard.dismiss();
      const lastFocusedInputHandleTemporary = lastFocusedInputHandle.current;
      android && (lastFocusedInputHandle.current = null);
      inputFieldRef?.current?.blur();
      outputFieldRef?.current?.blur();
      nativeFieldRef?.current?.blur();
      const internalNavigate = () => {
        android && Keyboard.removeListener('keyboardDidHide', internalNavigate);
        setParams({ focused: false });
        navigate(Routes.SWAP_DETAILS_SHEET, {
          confirmButtonProps,
          currentNetwork,
          flashbotTransaction: flashbots,
          isRefuelTx,
          onClose: () => {
            resetRefuelState();
          },
          restoreFocusOnSwapModal: () => {
            android &&
              (lastFocusedInputHandle.current = lastFocusedInputHandleTemporary);
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
      ios || !isKeyboardOpen()
        ? internalNavigate()
        : Keyboard.addListener('keyboardDidHide', internalNavigate);
    },
    [
      confirmButtonProps,
      currentNetwork,
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
      resetRefuelState,
      setParams,
      type,
    ]
  );

  const {
    showRefuelSheet,
    refuelState,
    outputNativeAsset,
    minRefuelAmount,
  } = useSwapRefuel({
    inputCurrency,
    outputCurrency,
    tradeDetails,
  });

  const navigateToRefuelModal = useCallback(() => {
    const networkDetails = networkInfo[outputNetwork];
    android && Keyboard.dismiss();

    if (refuelState === RefuelState.Add) {
      return navigate(Routes.EXPLAIN_SHEET, {
        network: outputNetwork,
        networkName: networkDetails?.name,
        gasToken: networkDetails?.gasToken,
        nativeAsset: {
          mainnet_address: outputNativeAsset?.mainnet_address,
          address: outputNativeAsset?.address,
          type: outputNativeAsset?.type,
          symbol: outputNativeAsset?.symbol,
        },
        onRefuel: (
          navigate: () => void,
          goBack: () => void,
          handleClose: () => void
        ) => {
          setRefuel(true);
          handleClose();
          navigateToSwapDetailsModal(true);
        },
        onContinue: (
          navigate: () => void,
          goBack: () => void,
          handleClose: () => void
        ) => {
          handleClose();
          navigateToSwapDetailsModal();
        },
        type: 'swap_refuel_add',
      });
    }

    if (refuelState === RefuelState.Deduct) {
      return navigate(Routes.EXPLAIN_SHEET, {
        network: outputNetwork,
        networkName: networkDetails?.name,
        gasToken: networkDetails?.gasToken,
        nativeAsset: {
          address: outputNativeAsset?.address,
          mainnet_address: outputNativeAsset?.mainnet_address,
          type: outputNativeAsset?.type,
          symbol: outputNativeAsset?.symbol,
        },
        onRefuel: (
          navigate: () => void,
          goBack: () => void,
          handleClose: () => void
        ) => {
          // new input is sellAmount - minRefuelAmount if sellAmount > minRefuelAmount
          const newSellAmountAfterRefuel = subtract(
            tradeDetails?.sellAmount?.toString() || '0',
            minRefuelAmount?.toString() || '0'
          );

          // if user press adjust and add 3 go back to exchange modal and update the input token amount
          updateAndFocusInputAmount(fromWei(newSellAmountAfterRefuel));
          setHasDeductedRefuel(true);
          setRefuel(true);
          handleClose();
        },
        onContinue: (
          navigate: () => void,
          goBack: () => void,
          handleClose: () => void
        ) => {
          handleClose();
          navigateToSwapDetailsModal();
        },
        type: 'swap_refuel_deduct',
      });
    }

    if (refuelState === RefuelState.Notice) {
      return navigate(Routes.EXPLAIN_SHEET, {
        network: outputNetwork,
        networkName: networkDetails?.name,
        gasToken: networkDetails?.gasToken,
        nativeAsset: {
          mainnet_address: outputNativeAsset?.mainnet_address,
          type: outputNativeAsset?.type,
          symbol: outputNativeAsset?.symbol,
        },
        onProceed: (
          navigate: () => void,
          goBack: () => void,
          handleClose: () => void
        ) => {
          handleClose();
          navigateToSwapDetailsModal();
        },
        onContinue: (
          navigate: () => void,
          goBack: () => void,
          handleClose: () => void
        ) => {
          handleClose();
        },
        type: 'swap_refuel_notice',
      });
    }
  }, [
    outputNetwork,
    refuelState,
    navigate,
    outputNativeAsset?.mainnet_address,
    outputNativeAsset?.type,
    outputNativeAsset?.symbol,
    setRefuel,
    navigateToSwapDetailsModal,
    tradeDetails?.sellAmount,
    minRefuelAmount,
    updateAndFocusInputAmount,
    handleFocus,
  ]);

  const handleTapWhileDisabled = useCallback(() => {
    const lastFocusedInput = (lastFocusedInputHandle?.current as unknown) as TextInput;
    lastFocusedInput?.blur();
    navigate(Routes.EXPLAIN_SHEET, {
      inputToken: inputCurrency?.symbol,
      fromNetwork: inputNetwork,
      toNetwork: outputNetwork,
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
    inputNetwork,
    isBridgeSwap,
    isCrosschainSwap,
    lastFocusedInputHandle,
    navigate,
    outputCurrency?.symbol,
    outputNetwork,
  ]);

  const showConfirmButton = isSavings
    ? !!inputCurrency
    : !!inputCurrency && !!outputCurrency;

  const handleConfirmExchangePress = useCallback(() => {
    if (loading) return NOOP();
    if (showRefuelSheet && !hasDeductedRefuel) {
      return navigateToRefuelModal();
    }
    return navigateToSwapDetailsModal();
  }, [
    loading,
    showRefuelSheet,
    navigateToSwapDetailsModal,
    navigateToRefuelModal,
    hasDeductedRefuel,
  ]);

  return (
    <Wrapper keyboardType={KeyboardType.numpad}>
      <Box height="full" width="full">
        <FloatingPanels>
          <>
            <FloatingPanel
              borderRadius={39}
              overflow="visible"
              paddingBottom={{ custom: showOutputField ? 0 : 24 }}
              style={{
                ...(android && {
                  left: -1,
                }),
              }}
              testID={testID}
            >
              {showOutputField && <ExchangeNotch testID={testID} />}
              <ExchangeHeader testID={testID} title={title} />
              <ExchangeInputField
                disableInputCurrencySelection={isWithdrawal}
                editable={!!inputCurrency}
                inputAmount={inputAmountDisplay}
                inputCurrencyAddress={inputCurrency?.address}
                inputCurrencyAssetType={inputCurrency?.type}
                inputCurrencyMainnetAddress={inputCurrency?.mainnet_address}
                inputCurrencySymbol={inputCurrency?.symbol}
                inputFieldRef={inputFieldRef}
                loading={loading}
                nativeAmount={nativeAmountDisplay}
                nativeCurrency={nativeCurrency}
                nativeFieldRef={nativeFieldRef}
                network={inputNetwork}
                onFocus={handleFocus}
                onPressMaxBalance={updateMaxInputAmount}
                onPressSelectInputCurrency={chainId => {
                  resetRefuelState();
                  navigateToSelectInputCurrency(chainId);
                }}
                setInputAmount={updateInputAmount}
                setNativeAmount={updateNativeAmount}
                testID={`${testID}-input`}
                updateAmountOnFocus={
                  maxInputUpdate || flipCurrenciesUpdate || isFillingParams
                }
              />
              {showOutputField && (
                <ExchangeOutputField
                  editable={
                    !!outputCurrency &&
                    currentNetwork !== Network.arbitrum &&
                    !isCrosschainSwap
                  }
                  network={outputNetwork}
                  onFocus={handleFocus}
                  onPressSelectOutputCurrency={() => {
                    resetRefuelState();
                    navigateToSelectOutputCurrency(chainId);
                  }}
                  {...((currentNetwork === Network.arbitrum ||
                    isCrosschainSwap) &&
                    !!outputCurrency && {
                      onTapWhileDisabled: handleTapWhileDisabled,
                    })}
                  loading={loading}
                  outputAmount={outputAmountDisplay}
                  outputCurrencyAddress={outputCurrency?.address}
                  outputCurrencyAssetType={outputCurrency?.type}
                  outputCurrencyMainnetAddress={outputCurrency?.mainnet_address}
                  outputCurrencySymbol={outputCurrency?.symbol}
                  outputFieldRef={outputFieldRef}
                  setOutputAmount={updateOutputAmount}
                  testID={`${testID}-output`}
                  updateAmountOnFocus={
                    maxInputUpdate || flipCurrenciesUpdate || isFillingParams
                  }
                />
              )}
            </FloatingPanel>
            {isDeposit && (
              <DepositInfo
                amount={(Number(inputAmount) > 0 && outputAmount) || null}
                asset={outputCurrency}
                isHighPriceImpact={debouncedIsHighPriceImpact}
                onPress={navigateToSwapDetailsModal}
                priceImpactColor={priceImpactColor}
                priceImpactNativeAmount={priceImpactNativeAmount}
                priceImpactPercentDisplay={priceImpactPercentDisplay}
              />
            )}
            {!isSavings && showConfirmButton && (
              <ExchangeDetailsRow
                isHighPriceImpact={
                  !confirmButtonProps.disabled &&
                  !confirmButtonProps.loading &&
                  debouncedIsHighPriceImpact &&
                  isSufficientBalance
                }
                onFlipCurrencies={loading ? NOOP : flipCurrencies}
                onPressImpactWarning={navigateToSwapDetailsModal}
                onPressSettings={navigateToSwapSettingsSheet}
                priceImpactColor={priceImpactColor}
                priceImpactNativeAmount={priceImpactNativeAmount}
                priceImpactPercentDisplay={priceImpactPercentDisplay}
                type={type}
              />
            )}

            {isWithdrawal && <Box height="30px" />}
          </>
        </FloatingPanels>

        <Box>
          <Rows alignVertical="bottom" space="19px (Deprecated)">
            <Row height="content">
              {showConfirmButton && (
                <ConfirmExchangeButton
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
                currentNetwork={currentNetwork}
                flashbotTransaction={flashbots}
                marginBottom={0}
                marginTop={0}
                testID={`${testID}-gas`}
                crossChainServiceTime={getCrosschainSwapServiceTime(
                  tradeDetails as CrosschainQuote
                )}
              />
            </Row>
          </Rows>
        </Box>
      </Box>
    </Wrapper>
  );
}
