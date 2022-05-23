import { ChainId } from '@rainbow-me/swaps';
import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import equal from 'react-fast-compare';
import {
  Alert,
  InteractionManager,
  Keyboard,
  NativeModules,
} from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { useSafeArea } from 'react-native-safe-area-context';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { useDispatch, useSelector } from 'react-redux';
import { useMemoOne } from 'use-memo-one';
import { dismissingScreenListener } from '../../shim';
import {
  AnimatedExchangeFloatingPanels,
  ConfirmExchangeButton,
  DepositInfo,
  ExchangeDetailsRow,
  ExchangeFloatingPanels,
  ExchangeHeader,
  ExchangeInputField,
  ExchangeNotch,
  ExchangeOutputField,
} from '../components/exchange';
import { FloatingPanel } from '../components/floating-panels';
import { GasSpeedButton } from '../components/gas';
import { Centered, KeyboardFixedOpenLayout } from '../components/layout';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
import {
  ExchangeModalTypes,
  isKeyboardOpen,
  Network,
} from '@rainbow-me/helpers';
import { divide, greaterThan, multiply } from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useCurrentNonce,
  useDimensions,
  useGas,
  usePrevious,
  usePriceImpactDetails,
  useSwapCurrencies,
  useSwapCurrencyHandlers,
  useSwapDerivedOutputs,
  useSwapInputHandlers,
  useSwapInputRefs,
} from '@rainbow-me/hooks';
import { loadWallet } from '@rainbow-me/model/wallet';
import { useNavigation } from '@rainbow-me/navigation';
import { executeRap, getRapEstimationByType } from '@rainbow-me/raps';
import { swapClearState, updateSwapTypeDetails } from '@rainbow-me/redux/swap';
import { ETH_ADDRESS, ethUnits } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { ethereumUtils } from '@rainbow-me/utils';
import { useEthUSDPrice } from '@rainbow-me/utils/ethereumUtils';
import logger from 'logger';

const FloatingPanels = ios
  ? AnimatedExchangeFloatingPanels
  : ExchangeFloatingPanels;

const Wrapper = KeyboardFixedOpenLayout;

const InnerWrapper = styled(Centered).attrs({
  direction: 'column',
})(({ isSmallPhone, theme: { colors } }) => ({
  ...position.sizeAsObject('100%'),
  ...(ios && isSmallPhone && { maxHeight: 354 }),
  backgroundColor: colors.transparent,
}));

const Spacer = styled.View({
  height: 20,
});

const getInputHeaderTitle = (type, defaultInputAsset) => {
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

const getShowOutputField = type => {
  switch (type) {
    case ExchangeModalTypes.deposit:
    case ExchangeModalTypes.withdrawal:
      return false;
    default:
      return true;
  }
};

export default function ExchangeModal({
  defaultInputAsset,
  defaultOutputAsset,
  testID,
  type,
  typeSpecificParams,
}) {
  const { isSmallPhone } = useDimensions();
  const dispatch = useDispatch();
  const insets = useSafeArea();

  useLayoutEffect(() => {
    dispatch(updateSwapTypeDetails(type, typeSpecificParams));
  }, [dispatch, type, typeSpecificParams]);

  const title = getInputHeaderTitle(type, defaultInputAsset);
  const showOutputField = getShowOutputField(type);
  const priceOfEther = useEthUSDPrice();
  const genericAssets = useSelector(
    ({ data: { genericAssets } }) => genericAssets
  );

  const {
    navigate,
    setParams,
    dangerouslyGetParent,
    addListener,
  } = useNavigation();

  const {
    params: { focused },
  } = useRoute();

  const isDeposit = type === ExchangeModalTypes.deposit;
  const isWithdrawal = type === ExchangeModalTypes.withdrawal;
  const isSavings = isDeposit || isWithdrawal;
  const {
    selectedGasFee,
    gasFeeParamsBySpeed,
    startPollingGasFees,
    stopPollingGasFees,
    updateDefaultGasLimit,
    updateTxFee,
  } = useGas();
  const {
    accountAddress,
    flashbotsEnabled,
    nativeCurrency,
  } = useAccountSettings();

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(null);

  const prevGasFeesParamsBySpeed = usePrevious(gasFeeParamsBySpeed);

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
    flipCurrencies,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
  } = useSwapCurrencyHandlers({
    defaultInputAsset,
    defaultOutputAsset,
    inputFieldRef,
    lastFocusedInputHandle,
    outputFieldRef,
    setLastFocusedInputHandle,
    title,
    type,
  });

  const chainId = useMemo(
    () => ethereumUtils.getChainIdFromType(inputCurrency?.type),
    [inputCurrency]
  );

  const currentNetwork = useMemo(
    () => ethereumUtils.getNetworkFromChainId(chainId || 1),
    [chainId]
  );

  const basicSwap =
    ChainId.arbitrum === chainId
      ? ethUnits.basic_swap_arbitrum
      : ethUnits.basic_swap;

  const defaultGasLimit = isDeposit
    ? ethUnits.basic_deposit
    : isWithdrawal
    ? ethUnits.basic_withdrawal
    : basicSwap;

  const getNextNonce = useCurrentNonce(accountAddress, currentNetwork);

  useEffect(() => {
    const getProvider = async () => {
      const p = await getProviderForNetwork(currentNetwork);
      setCurrentProvider(p);
    };
    getProvider();
  }, [currentNetwork]);

  const {
    result: {
      derivedValues: { inputAmount, nativeAmount, outputAmount },
      displayValues: { inputAmountDisplay, outputAmountDisplay },
      tradeDetails,
    },
    loading,
    resetSwapInputs,
    insufficientLiquidity,
  } = useSwapDerivedOutputs(chainId);

  const lastTradeDetails = usePrevious(tradeDetails);

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
    loading || equal(lastTradeDetails, tradeDetails)
  );

  const flashbots = currentNetwork === Network.mainnet && flashbotsEnabled;

  const isDismissing = useRef(false);
  useEffect(() => {
    if (ios) {
      return;
    }
    dismissingScreenListener.current = () => {
      Keyboard.dismiss();
      isDismissing.current = true;
    };
    const unsubscribe = (
      dangerouslyGetParent()?.dangerouslyGetParent()?.addListener || addListener
    )('transitionEnd', ({ data: { closing } }) => {
      if (!closing && isDismissing.current) {
        isDismissing.current = false;
        lastFocusedInputHandle?.current?.focus();
      }
    });
    return () => {
      unsubscribe();
      dismissingScreenListener.current = undefined;
    };
  }, [addListener, dangerouslyGetParent, lastFocusedInputHandle]);

  useEffect(() => {
    return () => {
      dispatch(swapClearState());
      resetSwapInputs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCustomGasBlur = useCallback(() => {
    lastFocusedInputHandle?.current?.focus();
  }, [lastFocusedInputHandle]);

  const [navigating, setNavigating] = useState(false);

  const navigateToOutput = useCallback(() => {
    !navigating && navigateToSelectOutputCurrency(chainId);
    setNavigating(true);
    setTimeout(() => setNavigating(false), 1000);
  }, [navigateToSelectOutputCurrency, navigating, chainId]);

  const navigateToInput = useCallback(() => {
    !navigating && navigateToSelectInputCurrency();
    setNavigating(true);
    setTimeout(() => setNavigating(false), 1000);
  }, [navigateToSelectInputCurrency, navigating]);

  // Navigate to select input currency automatically
  // TODO: Do this in a better way
  useEffect(() => {
    if (focused && IS_TESTING !== 'true') {
      if (!defaultInputAsset && !inputCurrency) {
        navigateToInput();
      } else if (!outputCurrency) {
        navigateToOutput();
      }
    }
  }, [
    defaultInputAsset,
    inputCurrency,
    outputCurrency,
    focused,
    navigateToInput,
    navigateToOutput,
  ]);

  const updateGasLimit = useCallback(async () => {
    try {
      if (
        ((type === ExchangeModalTypes.swap ||
          type === ExchangeModalTypes.deposit) &&
          !(inputCurrency && outputCurrency)) ||
        type === ExchangeModalTypes.withdraw
      ) {
        return;
      }
      const swapParams = {
        chainId,
        inputAmount,
        outputAmount,
        provider: currentProvider,
        tradeDetails,
      };
      const gasLimit = await getRapEstimationByType(type, {
        provider: currentProvider,
        swapParameters: swapParams,
      });
      if (gasLimit) {
        if (currentNetwork === Network.optimism) {
          if (tradeDetails) {
            const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(
              {
                data: tradeDetails.data,
                from: tradeDetails.from,
                to: tradeDetails.to,
                value: tradeDetails.value,
              },
              currentProvider
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
          updateTxFee(gasLimit);
        }
      }
    } catch (error) {
      updateTxFee(defaultGasLimit);
    }
  }, [
    chainId,
    currentNetwork,
    currentProvider,
    defaultGasLimit,
    inputAmount,
    inputCurrency,
    outputAmount,
    outputCurrency,
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
      updateTxFee(defaultGasLimit);
    }
  }, [
    defaultGasLimit,
    gasFeeParamsBySpeed,
    prevGasFeesParamsBySpeed,
    updateTxFee,
  ]);

  // Update gas limit
  useEffect(() => {
    if (!isEmpty(gasFeeParamsBySpeed)) {
      updateGasLimit();
    }
  }, [gasFeeParamsBySpeed, updateGasLimit]);

  // Liten to gas prices, Uniswap reserves updates
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

  const handlePressMaxBalance = useCallback(async () => {
    updateMaxInputAmount();
  }, [updateMaxInputAmount]);

  const checkGasVsOutput = async (gasPrice, outputPrice) => {
    if (greaterThan(outputPrice, 0) && greaterThan(gasPrice, outputPrice)) {
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

  const handleSubmit = useCallback(async () => {
    let amountInUSD = 0;
    let NotificationManager = ios ? NativeModules.NotificationManager : null;
    try {
      // Tell iOS we're running a rap (for tracking purposes)
      NotificationManager &&
        NotificationManager.postNotification('rapInProgress');
      if (nativeCurrency === 'usd') {
        amountInUSD = nativeAmount;
      } else {
        const ethPriceInNativeCurrency =
          genericAssets[ETH_ADDRESS]?.price?.value ?? 0;
        const tokenPriceInNativeCurrency =
          genericAssets[inputCurrency?.address]?.price?.value ?? 0;
        const tokensPerEth = divide(
          tokenPriceInNativeCurrency,
          ethPriceInNativeCurrency
        );
        const inputTokensInEth = multiply(tokensPerEth, inputAmount);
        amountInUSD = multiply(priceOfEther, inputTokensInEth);
      }
    } catch (e) {
      logger.log('error getting the swap amount in USD price', e);
    } finally {
      analytics.track(`Submitted ${type}`, {
        amountInUSD,
        defaultInputAsset: defaultInputAsset?.symbol ?? '',
        isHighPriceImpact,
        name: outputCurrency?.name ?? '',
        priceImpact: priceImpactPercentDisplay,
        symbol: outputCurrency?.symbol || '',
        tokenAddress: outputCurrency?.address || '',
        type,
      });
    }

    const outputInUSD = multiply(outputPriceValue, outputAmount);
    const gasPrice = selectedGasFee?.gasFee?.maxFee?.native?.value?.amount;
    const cancelTransaction = await checkGasVsOutput(gasPrice, outputInUSD);

    if (cancelTransaction) {
      return;
    }

    setIsAuthorizing(true);
    try {
      const wallet = await loadWallet();
      if (!wallet) {
        setIsAuthorizing(false);
        logger.sentry(`aborting ${type} due to missing wallet`);
        return;
      }

      const callback = (success = false, errorMessage = null) => {
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
      const swapParameters = {
        chainId,
        flashbots,
        inputAmount,
        nonce,
        outputAmount,
        tradeDetails,
      };
      await executeRap(wallet, type, { swapParameters }, callback);
      logger.log('[exchange - handle submit] executed rap!');
      analytics.track(`Completed ${type}`, {
        amountInUSD,
        input: defaultInputAsset?.symbol || '',
        output: outputCurrency?.symbol || '',
        type,
      });
      // Tell iOS we finished running a rap (for tracking purposes)
      NotificationManager &&
        NotificationManager.postNotification('rapCompleted');
    } catch (error) {
      setIsAuthorizing(false);
      logger.log('[exchange - handle submit] error submitting swap', error);
      setParams({ focused: false });
      navigate(Routes.WALLET_SCREEN);
    }
  }, [
    chainId,
    defaultInputAsset?.symbol,
    flashbots,
    genericAssets,
    getNextNonce,
    inputAmount,
    inputCurrency?.address,
    isHighPriceImpact,
    nativeAmount,
    nativeCurrency,
    navigate,
    outputAmount,
    outputCurrency?.address,
    outputCurrency?.name,
    outputCurrency?.symbol,
    outputPriceValue,
    priceImpactPercentDisplay,
    priceOfEther,
    selectedGasFee?.gasFee?.maxFee?.native?.value?.amount,
    setParams,
    tradeDetails,
    type,
  ]);

  const confirmButtonProps = useMemoOne(
    () => ({
      disabled: !Number(inputAmount) || !tradeDetails,
      inputAmount,
      insufficientLiquidity,
      isAuthorizing,
      isHighPriceImpact,
      loading,
      onSubmit: handleSubmit,
      tradeDetails,
      type,
    }),
    [
      loading,
      handleSubmit,
      inputAmount,
      isAuthorizing,
      isHighPriceImpact,
      testID,
      tradeDetails,
      type,
      insufficientLiquidity,
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
      android && Keyboard.removeListener('keyboardDidHide', internalNavigate);
      setParams({ focused: false });
      navigate(Routes.SWAP_SETTINGS_SHEET, {
        asset: outputCurrency,
        restoreFocusOnSwapModal: () => {
          android &&
            (lastFocusedInputHandle.current = lastFocusedInputHandleTemporary);
          setParams({ focused: true });
        },
        type: 'swap_settings',
      });
      analytics.track('Opened Swap Settings');
    };
    ios || !isKeyboardOpen()
      ? internalNavigate()
      : Keyboard.addListener('keyboardDidHide', internalNavigate);
  }, [
    inputFieldRef,
    lastFocusedInputHandle,
    nativeFieldRef,
    navigate,
    outputCurrency,
    outputFieldRef,
    setParams,
  ]);

  const navigateToSwapDetailsModal = useCallback(() => {
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
        restoreFocusOnSwapModal: () => {
          android &&
            (lastFocusedInputHandle.current = lastFocusedInputHandleTemporary);
          setParams({ focused: true });
        },
        type: 'swap_details',
      });
      analytics.track('Opened Swap Details modal', {
        name: outputCurrency?.name ?? '',
        symbol: outputCurrency?.symbol ?? '',
        tokenAddress: outputCurrency?.address ?? '',
        type,
      });
    };
    ios || !isKeyboardOpen()
      ? internalNavigate()
      : Keyboard.addListener('keyboardDidHide', internalNavigate);
  }, [
    confirmButtonProps,
    currentNetwork,
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
  ]);

  const showConfirmButton = isSavings
    ? !!inputCurrency
    : !!inputCurrency && !!outputCurrency;

  return (
    <Wrapper>
      <InnerWrapper isSmallPhone={isSmallPhone}>
        <FloatingPanels>
          <FloatingPanel
            overflow="visible"
            paddingBottom={showOutputField ? 0 : 26}
            radius={39}
            testID={testID}
          >
            {showOutputField && <ExchangeNotch />}
            <ExchangeHeader testID={testID} title={title} />
            <ExchangeInputField
              disableInputCurrencySelection={isWithdrawal}
              editable={!!inputCurrency}
              inputAmount={inputAmountDisplay}
              inputCurrencyAddress={
                inputCurrency?.mainnet_address || inputCurrency?.address
              }
              inputCurrencyAssetType={inputCurrency?.type}
              inputCurrencySymbol={inputCurrency?.symbol}
              inputFieldRef={inputFieldRef}
              nativeAmount={nativeAmount}
              nativeCurrency={nativeCurrency}
              nativeFieldRef={nativeFieldRef}
              onFocus={handleFocus}
              onPressMaxBalance={handlePressMaxBalance}
              onPressSelectInputCurrency={navigateToInput}
              setInputAmount={updateInputAmount}
              setNativeAmount={updateNativeAmount}
              testID={`${testID}-input`}
            />
            {showOutputField && (
              <ExchangeOutputField
                editable={!!outputCurrency}
                onFocus={handleFocus}
                onPressSelectOutputCurrency={navigateToOutput}
                outputAmount={outputAmountDisplay}
                outputCurrencyAddress={
                  outputCurrency?.mainnet_address || outputCurrency?.address
                }
                outputCurrencyAssetType={outputCurrency?.type}
                outputCurrencySymbol={outputCurrency?.symbol}
                outputFieldRef={outputFieldRef}
                setOutputAmount={updateOutputAmount}
                testID={`${testID}-output`}
              />
            )}
          </FloatingPanel>
          {isDeposit && (
            <DepositInfo
              amount={(inputAmount > 0 && outputAmount) || null}
              asset={outputCurrency}
              isHighPriceImpact={isHighPriceImpact}
              onPress={navigateToSwapDetailsModal}
              priceImpactColor={priceImpactColor}
              priceImpactNativeAmount={priceImpactNativeAmount}
              priceImpactPercentDisplay={priceImpactPercentDisplay}
              testID="deposit-info-button"
            />
          )}
          {!isSavings && showConfirmButton && (
            <ExchangeDetailsRow
              isHighPriceImpact={isHighPriceImpact}
              onFlipCurrencies={flipCurrencies}
              onPressSettings={navigateToSwapSettingsSheet}
              priceImpactColor={priceImpactColor}
              priceImpactNativeAmount={priceImpactNativeAmount}
              priceImpactPercentDisplay={priceImpactPercentDisplay}
              type={type}
            />
          )}

          {isWithdrawal && <Spacer />}

          {showConfirmButton && (
            <ConfirmExchangeButton
              {...confirmButtonProps}
              flashbots={flashbots}
              onPressViewDetails={navigateToSwapDetailsModal}
              testID={`${testID}-confirm-button`}
            />
          )}
        </FloatingPanels>
        {inputCurrency && outputCurrency && (
          <GasSpeedButton
            asset={outputCurrency}
            bottom={insets.bottom - 7}
            currentNetwork={currentNetwork}
            dontBlur
            onCustomGasBlur={handleCustomGasBlur}
            testID={`${testID}-gas`}
          />
        )}
      </InnerWrapper>
    </Wrapper>
  );
}
