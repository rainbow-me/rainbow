import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard } from 'react-native';
import Animated, { Extrapolate } from 'react-native-reanimated';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { useDispatch } from 'react-redux';
import { dismissingScreenListener } from '../../shim';
import { interpolate } from '../components/animations';
import {
  ConfirmExchangeButton,
  ExchangeInputField,
  ExchangeModalHeader,
  ExchangeNotch,
  ExchangeOutputField,
  SlippageWarning,
} from '../components/exchange';
import SwapInfo from '../components/exchange/SwapInfo';
import { FloatingPanel, FloatingPanels } from '../components/floating-panels';
import { GasSpeedButton } from '../components/gas';
import { Centered, KeyboardFixedOpenLayout } from '../components/layout';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import isKeyboardOpen from '@rainbow-me/helpers/isKeyboardOpen';
import {
  useAccountSettings,
  useBlockPolling,
  useGas,
  useMaxInputBalance,
  usePrevious,
  useSwapDetails,
  useSwapInputOutputTokens,
  useSwapInputRefs,
  useSwapInputs,
  useSwapInputValues,
  useUniswapCurrencies,
  useUniswapMarketDetails,
} from '@rainbow-me/hooks';
import { loadWallet } from '@rainbow-me/model/wallet';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { executeRap } from '@rainbow-me/raps';
import { multicallClearState } from '@rainbow-me/redux/multicall';
import { swapClearState } from '@rainbow-me/redux/swap';
import { ethUnits } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import { backgroundTask, isNewValueForPath } from '@rainbow-me/utils';
import logger from 'logger';

const AnimatedFloatingPanels = Animated.createAnimatedComponent(FloatingPanels);
const Wrapper = ios ? KeyboardFixedOpenLayout : Fragment;

export default function ExchangeModal({
  createRap,
  cTokenBalance,
  defaultInputAsset,
  estimateRap,
  inputHeaderTitle,
  showOutputField,
  supplyBalanceUnderlying,
  testID,
  type,
  underlyingPrice,
}) {
  const {
    navigate,
    setParams,
    dangerouslyGetParent,
    addListener,
  } = useNavigation();
  const {
    params: { tabTransitionPosition },
  } = useRoute();

  const isDeposit = type === ExchangeModalTypes.deposit;
  const isWithdrawal = type === ExchangeModalTypes.withdrawal;

  const defaultGasLimit = isDeposit
    ? ethUnits.basic_deposit
    : isWithdrawal
    ? ethUnits.basic_withdrawal
    : ethUnits.basic_swap;

  const dispatch = useDispatch();

  const {
    isSufficientGas,
    selectedGasPrice,
    startPollingGasPrices,
    stopPollingGasPrices,
    updateDefaultGasLimit,
    updateTxFee,
  } = useGas();
  const { initWeb3Listener, stopWeb3Listener } = useBlockPolling();
  const { nativeCurrency } = useAccountSettings();
  const prevSelectedGasPrice = usePrevious(selectedGasPrice);
  const { maxInputBalance, updateMaxInputBalance } = useMaxInputBalance();

  const { areTradeDetailsValid } = useSwapDetails();

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [slippage, setSlippage] = useState(null);

  useAndroidBackHandler(() => {
    navigate(Routes.WALLET_SCREEN);
    return true;
  });

  const {
    defaultInputAddress,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    previousInputCurrency,
  } = useUniswapCurrencies({
    defaultInputAsset,
    inputHeaderTitle,
    isDeposit,
    isWithdrawal,
    type,
    underlyingPrice,
  });

  const { inputCurrency, outputCurrency } = useSwapInputOutputTokens();

  const {
    handleFocus,
    inputFieldRef,
    lastFocusedInputHandle,
    nativeFieldRef,
    outputFieldRef,
  } = useSwapInputRefs();

  const {
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  } = useSwapInputs({
    defaultInputAsset,
    isWithdrawal,
    maxInputBalance,
    nativeFieldRef,
    supplyBalanceUnderlying,
    type,
  });

  const {
    inputAmount,
    inputAmountDisplay,
    isSufficientBalance,
    nativeAmount,
    isMax,
    outputAmount,
    outputAmountDisplay,
  } = useSwapInputValues();

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

  const handleCustomGasBlur = useCallback(() => {
    lastFocusedInputHandle?.current?.focus();
  }, [lastFocusedInputHandle]);

  // Calculate market details
  const { isSufficientLiquidity, tradeDetails } = useUniswapMarketDetails({
    defaultInputAddress,
    inputFieldRef,
    isDeposit,
    isWithdrawal,
    maxInputBalance,
    outputFieldRef,
    setSlippage,
    updateInputAmount,
    updateOutputAmount,
  });

  const updateGasLimit = useCallback(async () => {
    try {
      const gasLimit = await estimateRap({
        inputAmount,
        inputCurrency,
        outputAmount,
        outputCurrency,
        tradeDetails,
      });
      if (inputCurrency && outputCurrency) {
        updateTxFee(gasLimit);
      }
    } catch (error) {
      updateTxFee(defaultGasLimit);
    }
  }, [
    defaultGasLimit,
    estimateRap,
    inputAmount,
    inputCurrency,
    outputAmount,
    outputCurrency,
    tradeDetails,
    updateTxFee,
  ]);

  // Update gas limit
  useEffect(() => {
    updateGasLimit();
  }, [updateGasLimit]);

  useEffect(() => {
    return () => {
      dispatch(multicallClearState());
      dispatch(swapClearState());
    };
  }, [dispatch]);

  // Set default gas limit
  useEffect(() => {
    setTimeout(() => {
      updateTxFee(defaultGasLimit);
    }, 1000);
  }, [defaultGasLimit, updateTxFee]);

  const clearForm = useCallback(() => {
    logger.log('[exchange] - clear form');
    inputFieldRef?.current?.clear();
    nativeFieldRef?.current?.clear();
    outputFieldRef?.current?.clear();
    updateInputAmount();
    updateMaxInputBalance();
  }, [
    inputFieldRef,
    nativeFieldRef,
    outputFieldRef,
    updateInputAmount,
    updateMaxInputBalance,
  ]);

  // Clear form and reset max input balance on new input currency
  useEffect(() => {
    if (isNewValueForPath(inputCurrency, previousInputCurrency, 'address')) {
      clearForm();
      updateMaxInputBalance(inputCurrency);
    }
  }, [clearForm, inputCurrency, previousInputCurrency, updateMaxInputBalance]);

  // Recalculate max input balance when gas price changes if input currency is ETH
  useEffect(() => {
    if (
      inputCurrency?.address === 'eth' &&
      get(prevSelectedGasPrice, 'txFee.value.amount', 0) !==
        get(selectedGasPrice, 'txFee.value.amount', 0)
    ) {
      updateMaxInputBalance(inputCurrency);
    }
  }, [
    inputCurrency,
    prevSelectedGasPrice,
    selectedGasPrice,
    updateMaxInputBalance,
  ]);

  // Liten to gas prices, Uniswap reserves updates
  useEffect(() => {
    updateDefaultGasLimit(defaultGasLimit);
    startPollingGasPrices();
    initWeb3Listener();
    return () => {
      stopPollingGasPrices();
      stopWeb3Listener();
    };
  }, [
    defaultGasLimit,
    initWeb3Listener,
    startPollingGasPrices,
    stopPollingGasPrices,
    stopWeb3Listener,
    updateDefaultGasLimit,
  ]);

  // Update input amount when max is set and the max input balance changed
  useEffect(() => {
    if (isMax) {
      let maxBalance = maxInputBalance;
      inputFieldRef?.current?.blur();
      if (isWithdrawal) {
        maxBalance = supplyBalanceUnderlying;
      }
      updateInputAmount(maxBalance, maxBalance, true, true);
    }
  }, [
    inputFieldRef,
    isMax,
    isWithdrawal,
    maxInputBalance,
    supplyBalanceUnderlying,
    updateInputAmount,
  ]);

  const isSlippageWarningVisible =
    isSufficientBalance && !!inputAmount && !!outputAmount;
  const prevIsSlippageWarningVisible = usePrevious(isSlippageWarningVisible);
  useEffect(() => {
    if (isSlippageWarningVisible && !prevIsSlippageWarningVisible) {
      analytics.track('Showing high slippage warning in Swap', {
        name: outputCurrency.name,
        slippage,
        symbol: outputCurrency.symbol,
        tokenAddress: outputCurrency.address,
        type,
      });
    }
  }, [
    isSlippageWarningVisible,
    outputCurrency,
    prevIsSlippageWarningVisible,
    slippage,
    type,
  ]);

  const handlePressMaxBalance = useCallback(async () => {
    let maxBalance = maxInputBalance;
    if (isWithdrawal) {
      maxBalance = supplyBalanceUnderlying;
    }
    analytics.track('Selected max balance', {
      defaultInputAsset: defaultInputAsset?.symbol,
      type,
      value: Number(maxBalance.toString()),
    });
    return updateInputAmount(maxBalance, maxBalance, true, true);
  }, [
    defaultInputAsset,
    isWithdrawal,
    maxInputBalance,
    supplyBalanceUnderlying,
    type,
    updateInputAmount,
  ]);

  const handleSubmit = useCallback(() => {
    backgroundTask.execute(async () => {
      analytics.track(`Submitted ${type}`, {
        defaultInputAsset: defaultInputAsset?.symbol,
        isSlippageWarningVisible,
        name: outputCurrency?.name,
        slippage,
        symbol: outputCurrency?.symbol,
        tokenAddress: outputCurrency?.address,
        type,
      });

      setIsAuthorizing(true);
      try {
        const wallet = await loadWallet();
        if (!wallet) {
          setIsAuthorizing(false);
          logger.sentry(`aborting ${type} due to missing wallet`);
          return;
        }

        setIsAuthorizing(false);
        const callback = () => {
          setParams({ focused: false });
          navigate(Routes.PROFILE_SCREEN);
        };
        const rap = await createRap({
          callback,
          inputAmount: isWithdrawal && isMax ? cTokenBalance : inputAmount,
          inputCurrency,
          isMax,
          outputAmount,
          outputCurrency,
          selectedGasPrice,
          tradeDetails,
        });
        logger.log('[exchange - handle submit] rap', rap);
        await executeRap(wallet, rap);
        logger.log('[exchange - handle submit] executed rap!');
        analytics.track(`Completed ${type}`, {
          defaultInputAsset: defaultInputAsset?.symbol,
          type,
        });
      } catch (error) {
        setIsAuthorizing(false);
        logger.log('[exchange - handle submit] error submitting swap', error);
        setParams({ focused: false });
        navigate(Routes.WALLET_SCREEN);
      }
    });
  }, [
    type,
    defaultInputAsset,
    isSlippageWarningVisible,
    outputCurrency,
    slippage,
    createRap,
    isWithdrawal,
    isMax,
    cTokenBalance,
    inputAmount,
    inputCurrency,
    outputAmount,
    selectedGasPrice,
    tradeDetails,
    setParams,
    navigate,
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
      navigate(Routes.SWAP_DETAILS_SCREEN, {
        restoreFocusOnSwapModal: () => {
          android &&
            (lastFocusedInputHandle.current = lastFocusedInputHandleTemporary);
          setParams({ focused: true });
        },
        type: 'swap_details',
      });
      analytics.track('Opened Swap Details modal', {
        name: outputCurrency?.name,
        symbol: outputCurrency?.symbol,
        tokenAddress: outputCurrency?.address,
        type,
      });
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
    type,
  ]);

  const showDetailsButton = useMemo(() => {
    return (
      !(isDeposit || isWithdrawal) &&
      inputCurrency?.symbol &&
      outputCurrency?.symbol &&
      areTradeDetailsValid
    );
  }, [
    areTradeDetailsValid,
    inputCurrency,
    isDeposit,
    isWithdrawal,
    outputCurrency,
  ]);

  const showConfirmButton =
    isDeposit || isWithdrawal
      ? !!inputCurrency
      : !!inputCurrency && !!outputCurrency;

  const { colors } = useTheme();

  return (
    <Wrapper>
      <Centered
        {...(ios
          ? position.sizeAsObject('100%')
          : { style: { height: 500, top: 0 } })}
        backgroundColor={colors.transparent}
        direction="column"
      >
        <AnimatedFloatingPanels
          margin={0}
          paddingTop={24}
          style={{
            opacity: android
              ? 1
              : interpolate(tabTransitionPosition, {
                  extrapolate: Extrapolate.CLAMP,
                  inputRange: [0, 0, 1],
                  outputRange: [1, 1, 0],
                }),
            transform: [
              {
                scale: android
                  ? 1
                  : interpolate(tabTransitionPosition, {
                      extrapolate: Animated.Extrapolate.CLAMP,
                      inputRange: [0, 0, 1],
                      outputRange: [1, 1, 0.9],
                    }),
              },
              {
                translateX: android
                  ? 0
                  : interpolate(tabTransitionPosition, {
                      extrapolate: Animated.Extrapolate.CLAMP,
                      inputRange: [0, 0, 1],
                      outputRange: [0, 0, -8],
                    }),
              },
            ],
          }}
        >
          <FloatingPanel
            overflow="visible"
            paddingBottom={showOutputField ? 0 : 26}
            radius={39}
            testID={testID}
          >
            <ExchangeModalHeader
              onPressDetails={navigateToSwapDetailsModal}
              showDetailsButton={showDetailsButton}
              testID={testID + '-header'}
              title={inputHeaderTitle}
            />
            {showOutputField && <ExchangeNotch />}
            <ExchangeInputField
              disableInputCurrencySelection={isWithdrawal}
              inputAmount={inputAmountDisplay}
              inputCurrencyAddress={inputCurrency?.address}
              inputCurrencySymbol={inputCurrency?.symbol}
              inputFieldRef={inputFieldRef}
              nativeAmount={nativeAmount}
              nativeCurrency={nativeCurrency}
              nativeFieldRef={nativeFieldRef}
              onFocus={handleFocus}
              onPressMaxBalance={handlePressMaxBalance}
              onPressSelectInputCurrency={navigateToSelectInputCurrency}
              setInputAmount={updateInputAmount}
              setNativeAmount={updateNativeAmount}
              testID={testID + '-input'}
            />
            {showOutputField && (
              <ExchangeOutputField
                onFocus={handleFocus}
                onPressSelectOutputCurrency={navigateToSelectOutputCurrency}
                outputAmount={outputAmountDisplay}
                outputCurrencyAddress={outputCurrency?.address}
                outputCurrencySymbol={outputCurrency?.symbol}
                outputFieldRef={outputFieldRef}
                setOutputAmount={updateOutputAmount}
                testID={testID + '-output'}
              />
            )}
          </FloatingPanel>
          {isDeposit && (
            <SwapInfo
              amount={(inputAmount > 0 && outputAmountDisplay) || null}
              asset={outputCurrency}
              testID="swap-info-button"
            />
          )}
          {isSlippageWarningVisible && <SlippageWarning slippage={slippage} />}
          {showConfirmButton && (
            <Fragment>
              <Centered
                flexShrink={0}
                paddingHorizontal={15}
                paddingTop={24}
                width="100%"
              >
                <ConfirmExchangeButton
                  disabled={!Number(inputAmountDisplay)}
                  isAuthorizing={isAuthorizing}
                  isDeposit={isDeposit}
                  isSufficientBalance={isSufficientBalance}
                  isSufficientGas={isSufficientGas}
                  isSufficientLiquidity={isSufficientLiquidity}
                  onSubmit={handleSubmit}
                  slippage={slippage}
                  testID={testID + '-confirm'}
                  type={type}
                />
              </Centered>
            </Fragment>
          )}
          <GasSpeedButton
            dontBlur
            onCustomGasBlur={handleCustomGasBlur}
            testID={testID + '-gas'}
            type={type}
          />
        </AnimatedFloatingPanels>
      </Centered>
    </Wrapper>
  );
}
