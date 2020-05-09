import analytics from '@segment/analytics-react-native';
import { get, isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Animated from 'react-native-reanimated';
import { useIsFocused } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { toClass } from 'recompact';
import { interpolate } from '../components/animations';
import {
  ConfirmExchangeButton,
  ExchangeInputField,
  ExchangeModalHeader,
  ExchangeOutputField,
  SlippageWarning,
} from '../components/exchange';
import SwapInfo from '../components/exchange/SwapInfo';
import { FloatingPanel, FloatingPanels } from '../components/expanded-state';
import { GasSpeedButton } from '../components/gas';
import { Centered, KeyboardFixedOpenLayout } from '../components/layout';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import {
  useAccountSettings,
  useBlockPolling,
  useGas,
  useMaxInputBalance,
  usePrevious,
  useSwapDetails,
  useSwapInputRefs,
  useUniswapAllowances,
  useUniswapCurrencies,
  useUniswapMarketDetails,
  useUniswapMarketPrice,
} from '../hooks';
import { loadWallet } from '../model/wallet';
import { executeRap } from '../raps/common';
import { savingsLoadState } from '../redux/savings';
import ethUnits from '../references/ethereum-units.json';
import { colors, padding, position } from '../styles';
import { backgroundTask, isNewValueForPath, logger } from '../utils';
import Routes from './Routes/routesNames';

export const exchangeModalBorderRadius = 30;

const AnimatedFloatingPanels = Animated.createAnimatedComponent(
  toClass(FloatingPanels)
);

const ExchangeModal = ({
  cTokenBalance,
  defaultInputAsset,
  estimateRap,
  inputHeaderTitle,
  navigation,
  createRap,
  showOutputField,
  supplyBalanceUnderlying,
  tabPosition,
  type,
  underlyingPrice,
}) => {
  const isDeposit = type === ExchangeModalTypes.deposit;
  const isWithdrawal = type === ExchangeModalTypes.withdrawal;

  const dispatch = useDispatch();
  const {
    gasPricesStartPolling,
    gasPricesStopPolling,
    gasUpdateDefaultGasLimit,
    gasUpdateTxFee,
    isSufficientGas,
    selectedGasPrice,
  } = useGas();
  const {
    inputReserve,
    outputReserve,
    uniswapClearCurrenciesAndReserves,
  } = useUniswapAllowances();
  const { web3ListenerInit, web3ListenerStop } = useBlockPolling();
  const { nativeCurrency } = useAccountSettings();
  const prevSelectedGasPrice = usePrevious(selectedGasPrice);
  const { getMarketPrice } = useUniswapMarketPrice();
  const { getMarketDetails } = useUniswapMarketDetails();

  const [isMax, setIsMax] = useState(false);
  const [inputAmount, setInputAmount] = useState(null);
  const [inputAmountDisplay, setInputAmountDisplay] = useState(null);
  const [inputAsExactAmount, setInputAsExactAmount] = useState(true);
  const { inputBalance, updateInputBalance } = useMaxInputBalance();

  const {
    areTradeDetailsValid,
    extraTradeDetails,
    updateExtraTradeDetails,
  } = useSwapDetails();

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSufficientBalance, setIsSufficientBalance] = useState(true);
  const [nativeAmount, setNativeAmount] = useState(null);
  const [outputAmount, setOutputAmount] = useState(null);
  const [outputAmountDisplay, setOutputAmountDisplay] = useState(null);
  const [showConfirmButton, setShowConfirmButton] = useState(
    isDeposit || isWithdrawal ? true : false
  );
  const [slippage, setSlippage] = useState(null);

  const isScreenFocused = useIsFocused();
  const wasScreenFocused = usePrevious(isScreenFocused);

  const {
    assignInputFieldRef,
    assignNativeFieldRef,
    assignOutputFieldRef,
    handleFocus,
    handleRefocusLastInput,
    inputFieldRef,
    lastFocusedInput,
    nativeFieldRef,
    outputFieldRef,
  } = useSwapInputRefs();

  const {
    defaultInputAddress,
    inputCurrency,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    outputCurrency,
    previousInputCurrency,
  } = useUniswapCurrencies({
    defaultInputAsset,
    inputHeaderTitle,
    isDeposit,
    isWithdrawal,
    navigation,
    setInputAsExactAmount,
    setShowConfirmButton,
    type,
    underlyingPrice,
  });

  const updateGasLimit = useCallback(
    async ({
      inputAmount,
      inputCurrency,
      inputReserve,
      outputAmount,
      outputCurrency,
      outputReserve,
    }) => {
      try {
        const gasLimit = await estimateRap({
          inputAmount,
          inputCurrency,
          inputReserve,
          outputAmount,
          outputCurrency,
          outputReserve,
        });
        dispatch(gasUpdateTxFee(gasLimit));
      } catch (error) {
        const defaultGasLimit = isDeposit
          ? ethUnits.basic_deposit
          : isWithdrawal
          ? ethUnits.basic_withdrawal
          : ethUnits.basic_swap;
        dispatch(gasUpdateTxFee(defaultGasLimit));
      }
    },
    [dispatch, estimateRap, gasUpdateTxFee, isDeposit, isWithdrawal]
  );

  useEffect(() => {
    updateGasLimit({
      inputAmount,
      inputCurrency,
      inputReserve,
      outputAmount,
      outputCurrency,
      outputReserve,
    });
  }, [
    inputAmount,
    inputCurrency,
    inputReserve,
    outputAmount,
    outputCurrency,
    outputReserve,
    updateGasLimit,
  ]);

  const updateInputAmount = useCallback(
    (
      newInputAmount,
      newAmountDisplay,
      newInputAsExactAmount = true,
      newIsMax = false
    ) => {
      setInputAmount(newInputAmount);
      setInputAsExactAmount(newInputAsExactAmount);
      setInputAmountDisplay(
        newAmountDisplay !== undefined ? newAmountDisplay : newInputAmount
      );
      setIsMax(newInputAmount && newIsMax);

      if (!nativeFieldRef.current.isFocused() || newIsMax) {
        let newNativeAmount = null;

        const isInputZero = isZero(newInputAmount);

        if (newInputAmount && !isInputZero) {
          let newNativePrice = get(inputCurrency, 'native.price.amount', null);
          if (isNil(newNativePrice)) {
            newNativePrice = getMarketPrice(inputCurrency, outputCurrency);
          }
          newNativeAmount = convertAmountToNativeAmount(
            newInputAmount,
            newNativePrice
          );
        }
        setNativeAmount(newNativeAmount);

        if (inputCurrency) {
          const newIsSufficientBalance =
            !newInputAmount ||
            (isWithdrawal
              ? greaterThanOrEqualTo(supplyBalanceUnderlying, newInputAmount)
              : greaterThanOrEqualTo(inputBalance, newInputAmount));

          setIsSufficientBalance(newIsSufficientBalance);
        }
      }

      if (newAmountDisplay) {
        analytics.track('Updated input amount', {
          category: isDeposit ? 'savings' : 'swap',
          defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
          type,
          value: Number(newAmountDisplay.toString()),
        });
      }
    },
    [
      defaultInputAsset,
      getMarketPrice,
      inputBalance,
      inputCurrency,
      isDeposit,
      isWithdrawal,
      nativeFieldRef,
      outputCurrency,
      supplyBalanceUnderlying,
      type,
    ]
  );

  const updateNativeAmount = useCallback(
    nativeAmount => {
      logger.log('update native amount', nativeAmount);
      let inputAmount = null;
      let inputAmountDisplay = null;

      const isNativeZero = isZero(nativeAmount);
      setNativeAmount(nativeAmount);

      setIsMax(false);

      if (nativeAmount && !isNativeZero) {
        let nativePrice = get(inputCurrency, 'native.price.amount', null);
        if (isNil(nativePrice)) {
          nativePrice = getMarketPrice(inputCurrency, outputCurrency);
        }
        inputAmount = convertAmountFromNativeValue(
          nativeAmount,
          nativePrice,
          inputCurrency.decimals
        );
        inputAmountDisplay = updatePrecisionToDisplay(
          inputAmount,
          nativePrice,
          true
        );
      }

      setInputAmount(inputAmount);
      setInputAmountDisplay(inputAmountDisplay);
      setInputAsExactAmount(true);
    },
    [getMarketPrice, inputCurrency, outputCurrency]
  );

  const updateOutputAmount = useCallback(
    (newOutputAmount, newAmountDisplay, newInputAsExactAmount = false) => {
      setInputAsExactAmount(newInputAsExactAmount);
      setOutputAmount(newOutputAmount);
      setOutputAmountDisplay(
        newAmountDisplay !== undefined ? newAmountDisplay : newOutputAmount
      );
      if (newAmountDisplay) {
        analytics.track('Updated output amount', {
          category: isWithdrawal || isDeposit ? 'savings' : 'swap',
          defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
          type,
          value: Number(newAmountDisplay.toString()),
        });
      }
    },
    [defaultInputAsset, isDeposit, isWithdrawal, type]
  );

  const clearForm = useCallback(() => {
    logger.log('[exchange] - clear form');
    if (inputFieldRef && inputFieldRef.current) inputFieldRef.current.clear();
    if (nativeFieldRef && nativeFieldRef.current)
      nativeFieldRef.current.clear();
    if (outputFieldRef && outputFieldRef.current)
      outputFieldRef.current.clear();
    updateInputAmount();
  }, [inputFieldRef, nativeFieldRef, outputFieldRef, updateInputAmount]);

  useEffect(() => {
    if (isNewValueForPath(inputCurrency, previousInputCurrency, 'address')) {
      clearForm();
      updateInputBalance(inputCurrency, selectedGasPrice);
    }
  }, [
    clearForm,
    inputCurrency,
    previousInputCurrency,
    selectedGasPrice,
    updateInputBalance,
  ]);

  // Recalculate balance when gas price changes
  useEffect(() => {
    if (
      inputCurrency &&
      inputCurrency.address === 'eth' &&
      get(prevSelectedGasPrice, 'txFee.value.amount', 0) !==
        get(selectedGasPrice, 'txFee.value.amount', 0)
    ) {
      updateInputBalance(inputCurrency, selectedGasPrice);
    }
  }, [
    inputCurrency,
    prevSelectedGasPrice,
    selectedGasPrice,
    updateInputBalance,
  ]);

  useEffect(() => {
    dispatch(
      gasUpdateDefaultGasLimit(
        isDeposit
          ? ethUnits.basic_deposit
          : isWithdrawal
          ? ethUnits.basic_withdrawal
          : ethUnits.basic_swap
      )
    );
    dispatch(gasPricesStartPolling());
    dispatch(web3ListenerInit());
    return () => {
      dispatch(uniswapClearCurrenciesAndReserves());
      dispatch(gasPricesStopPolling());
      dispatch(web3ListenerStop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update input max is set and the balance changed
  useEffect(() => {
    if (isMax) {
      updateInputAmount(inputBalance, inputBalance, true, true);
    }
  }, [inputBalance, isMax, updateInputAmount]);

  const inputCurrencyUniqueId = get(inputCurrency, 'uniqueId');
  const outputCurrencyUniqueId = get(outputCurrency, 'uniqueId');

  const inputReserveTokenAddress = get(inputReserve, 'token.address');
  const outputReserveTokenAddress = get(outputReserve, 'token.address');

  useEffect(() => {
    const refocusListener = navigation.addListener('refocus', () => {
      handleRefocusLastInput({
        inputCurrency,
        isScreenFocused,
        outputCurrency,
      });
    });

    return () => {
      refocusListener && refocusListener.remove();
    };
  }, [
    handleRefocusLastInput,
    inputCurrency,
    inputFieldRef,
    isScreenFocused,
    lastFocusedInput,
    nativeFieldRef,
    navigation,
    outputCurrency,
    outputFieldRef,
  ]);

  useEffect(() => {
    if (isScreenFocused && !wasScreenFocused) {
      navigation.emit('refocus');
    }
  }, [isScreenFocused, navigation, wasScreenFocused]);

  useEffect(() => {
    if (
      (isDeposit || isWithdrawal) &&
      inputCurrency &&
      inputCurrency.address === defaultInputAddress
    )
      return;
    const isNewNativeAmount = nativeFieldRef.current.isFocused();
    if (isNewNativeAmount) {
      getMarketDetails({
        inputAmount,
        inputAsExactAmount,
        inputBalance,
        inputCurrency,
        inputFieldRef,
        nativeCurrency,
        outputAmount,
        outputCurrency,
        outputFieldRef,
        setIsSufficientBalance,
        setSlippage,
        updateExtraTradeDetails,
        updateInputAmount,
        updateOutputAmount,
      });
    }
  }, [
    defaultInputAddress,
    getMarketDetails,
    inputAmount,
    inputAsExactAmount,
    inputBalance,
    inputCurrency,
    inputFieldRef,
    isDeposit,
    isWithdrawal,
    nativeCurrency,
    nativeFieldRef,
    outputAmount,
    outputCurrency,
    outputFieldRef,
    updateExtraTradeDetails,
    updateInputAmount,
    updateOutputAmount,
  ]);

  useEffect(() => {
    if (
      (isDeposit || isWithdrawal) &&
      inputCurrency &&
      inputCurrency.address === defaultInputAddress
    )
      return;
    getMarketDetails({
      inputAmount,
      inputAsExactAmount,
      inputBalance,
      inputCurrency,
      inputFieldRef,
      nativeCurrency,
      outputAmount,
      outputCurrency,
      outputFieldRef,
      setIsSufficientBalance,
      setSlippage,
      updateExtraTradeDetails,
      updateInputAmount,
      updateOutputAmount,
    });
  }, [
    defaultInputAddress,
    getMarketDetails,
    inputAmount,
    inputAsExactAmount,
    inputBalance,
    inputCurrency,
    inputCurrencyUniqueId,
    inputFieldRef,
    inputReserveTokenAddress,
    isDeposit,
    isWithdrawal,
    nativeCurrency,
    outputAmount,
    outputCurrency,
    outputCurrencyUniqueId,
    outputFieldRef,
    outputReserveTokenAddress,
    updateExtraTradeDetails,
    updateInputAmount,
    updateOutputAmount,
  ]);

  const handlePressMaxBalance = useCallback(async () => {
    let maxBalance;
    if (isWithdrawal) {
      maxBalance = supplyBalanceUnderlying;
    } else {
      maxBalance = inputBalance;
    }
    analytics.track('Selected max balance', {
      category: isDeposit || isWithdrawal ? 'savings' : 'swap',
      defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
      type,
      value: Number(maxBalance.toString()),
    });
    return updateInputAmount(maxBalance, maxBalance, true, true);
  }, [
    defaultInputAsset,
    inputBalance,
    isDeposit,
    isWithdrawal,
    supplyBalanceUnderlying,
    type,
    updateInputAmount,
  ]);

  const handleSubmit = useCallback(() => {
    backgroundTask.execute(async () => {
      analytics.track(`Submitted ${type}`, {
        category: isDeposit || isWithdrawal ? 'savings' : 'swap',
        defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
        type,
      });

      setIsAuthorizing(true);
      try {
        const wallet = await loadWallet();

        setIsAuthorizing(false);
        const callback = () => {
          navigation.setParams({ focused: false });
          navigation.navigate(Routes.PROFILE_SCREEN);
        };
        const rap = await createRap({
          callback,
          inputAmount: isWithdrawal && isMax ? cTokenBalance : inputAmount,
          inputAsExactAmount,
          inputCurrency,
          inputReserve,
          isMax,
          outputAmount,
          outputCurrency,
          outputReserve,
          selectedGasPrice: null,
        });
        logger.log('[exchange - handle submit] rap', rap);
        await executeRap(wallet, rap);
        if (isDeposit || isWithdrawal) {
          dispatch(savingsLoadState());
        }
        logger.log('[exchange - handle submit] executed rap!');
        analytics.track(`Completed ${type}`, {
          category: isDeposit || isWithdrawal ? 'savings' : 'swap',
          defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
          type,
        });
      } catch (error) {
        setIsAuthorizing(false);
        logger.log('[exchange - handle submit] error submitting swap', error);
        navigation.setParams({ focused: false });
        navigation.navigate(Routes.WALLET_SCREEN);
      }
    });
  }, [
    cTokenBalance,
    createRap,
    defaultInputAsset,
    dispatch,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    inputReserve,
    isDeposit,
    isMax,
    isWithdrawal,
    navigation,
    outputAmount,
    outputCurrency,
    outputReserve,
    type,
  ]);

  const navigateToSwapDetailsModal = useCallback(() => {
    inputFieldRef.current.blur();
    outputFieldRef.current.blur();
    nativeFieldRef.current.blur();
    navigation.setParams({ focused: false });
    navigation.navigate('SwapDetailsScreen', {
      ...extraTradeDetails,
      inputCurrencySymbol: get(inputCurrency, 'symbol'),
      outputCurrencySymbol: get(outputCurrency, 'symbol'),
      restoreFocusOnSwapModal: () => {
        navigation.setParams({ focused: true });
      },
      type: 'swap_details',
    });
  }, [
    extraTradeDetails,
    inputCurrency,
    inputFieldRef,
    nativeFieldRef,
    navigation,
    outputCurrency,
    outputFieldRef,
  ]);

  const isSlippageWarningVisible =
    isSufficientBalance && !!inputAmount && !!outputAmount;

  const showDetailsButton = useMemo(() => {
    return (
      !(isDeposit || isWithdrawal) &&
      get(inputCurrency, 'symbol') &&
      get(outputCurrency, 'symbol') &&
      areTradeDetailsValid
    );
  }, [
    areTradeDetailsValid,
    inputCurrency,
    isDeposit,
    isWithdrawal,
    outputCurrency,
  ]);

  return (
    <KeyboardFixedOpenLayout>
      <Centered
        {...position.sizeAsObject('100%')}
        backgroundColor={colors.transparent}
        direction="column"
      >
        <AnimatedFloatingPanels
          margin={0}
          style={{
            opacity: interpolate(tabPosition, {
              extrapolate: Animated.Extrapolate.CLAMP,
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }}
        >
          <FloatingPanel
            radius={exchangeModalBorderRadius}
            overflow="visible"
            style={{ paddingBottom: showOutputField ? 0 : 26 }}
          >
            <ExchangeModalHeader
              onPressDetails={navigateToSwapDetailsModal}
              showDetailsButton={showDetailsButton}
              title={inputHeaderTitle}
            />
            <ExchangeInputField
              disableInputCurrencySelection={isWithdrawal}
              inputAmount={inputAmountDisplay}
              inputCurrencyAddress={get(inputCurrency, 'address', null)}
              inputCurrencySymbol={get(inputCurrency, 'symbol', null)}
              assignInputFieldRef={assignInputFieldRef}
              nativeAmount={nativeAmount}
              nativeCurrency={nativeCurrency}
              assignNativeFieldRef={assignNativeFieldRef}
              onFocus={handleFocus}
              onPressMaxBalance={handlePressMaxBalance}
              onPressSelectInputCurrency={navigateToSelectInputCurrency}
              setInputAmount={updateInputAmount}
              setNativeAmount={updateNativeAmount}
            />
            {showOutputField && (
              <ExchangeOutputField
                bottomRadius={exchangeModalBorderRadius}
                onFocus={handleFocus}
                onPressSelectOutputCurrency={navigateToSelectOutputCurrency}
                outputAmount={outputAmountDisplay}
                outputCurrencyAddress={get(outputCurrency, 'address', null)}
                outputCurrencySymbol={get(outputCurrency, 'symbol', null)}
                assignOutputFieldRef={assignOutputFieldRef}
                setOutputAmount={updateOutputAmount}
              />
            )}
          </FloatingPanel>
          {isDeposit && (
            <SwapInfo
              asset={outputCurrency}
              amount={(inputAmount > 0 && outputAmountDisplay) || null}
            />
          )}
          {isSlippageWarningVisible && <SlippageWarning slippage={slippage} />}
          {showConfirmButton && (
            <Fragment>
              <Centered css={padding(24, 15, 0)} flexShrink={0} width="100%">
                <ConfirmExchangeButton
                  disabled={!Number(inputAmountDisplay)}
                  isAuthorizing={isAuthorizing}
                  isDeposit={isDeposit}
                  isSufficientBalance={isSufficientBalance}
                  isSufficientGas={isSufficientGas}
                  onSubmit={handleSubmit}
                  slippage={slippage}
                  type={type}
                />
              </Centered>
              <GasSpeedButton type={type} />
            </Fragment>
          )}
        </AnimatedFloatingPanels>
      </Centered>
    </KeyboardFixedOpenLayout>
  );
};

ExchangeModal.propTypes = {
  createRap: PropTypes.func,
  cTokenBalance: PropTypes.string,
  defaultInputAddress: PropTypes.string,
  estimateRap: PropTypes.func,
  inputHeaderTitle: PropTypes.string,
  navigation: PropTypes.object,
  supplyBalanceUnderlying: PropTypes.string,
  tabPosition: PropTypes.object, // animated value
  tradeDetails: PropTypes.object,
  type: PropTypes.oneOf(Object.values(ExchangeModalTypes)),
  underlyingPrice: PropTypes.string,
};

export default ExchangeModal;
