/* eslint-disable no-use-before-define */
import analytics from '@segment/analytics-react-native';
import { getMarketDetails as getUniswapMarketDetails } from '@uniswap/sdk';
import BigNumber from 'bignumber.js';
import { find, get, isNil, toLower } from 'lodash';
import PropTypes from 'prop-types';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, TextInput } from 'react-native';
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
import { calculateTradeDetails } from '../handlers/uniswap';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToNativeDisplay,
  convertNumberToString,
  convertRawAmountToDecimalFormat,
  divide,
  greaterThanOrEqualTo,
  isZero,
  multiply,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import {
  useAccountAssets,
  useAccountSettings,
  useBlockPolling,
  useGas,
  useInteraction,
  useMagicFocus,
  usePrevious,
  useUniswapAllowances,
  useUniswapAssetsInWallet,
} from '../hooks';
import { loadWallet } from '../model/wallet';
import { executeRap } from '../raps/common';
import { savingsLoadState } from '../redux/savings';
import ethUnits from '../references/ethereum-units.json';
import { colors, padding, position } from '../styles';
import { backgroundTask, ethereumUtils, logger } from '../utils';

export const exchangeModalBorderRadius = 30;

export const CurrencySelectionTypes = {
  input: 'input',
  output: 'output',
};

const AnimatedFloatingPanels = Animated.createAnimatedComponent(
  toClass(FloatingPanels)
);

const isSameAsset = (a, b) => {
  if (!a || !b) return false;
  const assetA = toLower(get(a, 'address', ''));
  const assetB = toLower(get(b, 'address', ''));
  return assetA === assetB;
};

const getNativeTag = field => get(field, '_nativeTag');

const createMissingAsset = (asset, underlyingPrice, priceOfEther) => {
  const { address, decimals, name, symbol } = asset;
  const priceInUSD = multiply(priceOfEther, underlyingPrice);

  return {
    address,
    decimals,
    name,
    native: {
      price: {
        amount: priceInUSD,
        display: '',
      },
    },
    price: {
      value: priceInUSD,
    },
    symbol,
    uniqueId: address,
  };
};

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
  const { allAssets } = useAccountAssets();
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
    uniswapUpdateInputCurrency,
    uniswapUpdateOutputCurrency,
  } = useUniswapAllowances();
  const { web3ListenerInit, web3ListenerStop } = useBlockPolling();
  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const { chainId, nativeCurrency } = useAccountSettings();
  const prevSelectedGasPrice = usePrevious(selectedGasPrice);

  const defaultInputAddress = get(defaultInputAsset, 'address');
  let defaultInputItemInWallet = ethereumUtils.getAsset(
    allAssets,
    defaultInputAddress
  );

  let defaultChosenInputItem = defaultInputItemInWallet;
  if (!defaultChosenInputItem && defaultInputAsset) {
    const eth = ethereumUtils.getAsset(allAssets);
    const priceOfEther = get(eth, 'native.price.amount', null);
    defaultChosenInputItem = createMissingAsset(
      defaultInputAsset,
      underlyingPrice,
      priceOfEther
    );
  }
  if (!defaultInputItemInWallet && isWithdrawal) {
    defaultInputItemInWallet = defaultChosenInputItem;
  } else if (!defaultInputItemInWallet) {
    defaultInputItemInWallet = ethereumUtils.getAsset(allAssets);
  }

  let defaultOutputItem = null;

  if (
    isDeposit &&
    (!defaultInputItemInWallet ||
      defaultInputItemInWallet.address !== defaultInputAddress)
  ) {
    defaultOutputItem = defaultChosenInputItem;
  }

  const [inputCurrency, setInputCurrency] = useState(defaultInputItemInWallet);
  const [isMax, setIsMax] = useState(false);
  const [inputAmount, setInputAmount] = useState(null);
  const [inputAmountDisplay, setInputAmountDisplay] = useState(null);
  const [inputAsExactAmount, setInputAsExactAmount] = useState(true);

  const [extraTradeDetails, setExtraTradeDetails] = useState({});
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSufficientBalance, setIsSufficientBalance] = useState(true);
  const [nativeAmount, setNativeAmount] = useState(null);
  const [outputAmount, setOutputAmount] = useState(null);
  const [outputAmountDisplay, setOutputAmountDisplay] = useState(null);
  const [outputCurrency, setOutputCurrency] = useState(defaultOutputItem);
  const [inputBalance, setInputBalance] = useState(null);
  const [showConfirmButton, setShowConfirmButton] = useState(
    isDeposit || isWithdrawal ? true : false
  );
  const [slippage, setSlippage] = useState(null);

  const previousInputCurrency = usePrevious(inputCurrency);
  const previousOutputCurrency = usePrevious(outputCurrency);

  const inputFieldRef = useRef();
  const nativeFieldRef = useRef();
  const outputFieldRef = useRef();

  const [lastFocusedInput, handleFocus] = useMagicFocus(inputFieldRef.current);
  const [createRefocusInteraction] = useInteraction();
  const isScreenFocused = useIsFocused();
  const wasScreenFocused = usePrevious(isScreenFocused);

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

  const updateInputBalance = useCallback(async () => {
    // Update current balance
    const inputBalance = await ethereumUtils.getBalanceAmount(
      selectedGasPrice,
      inputCurrency
    );
    setInputBalance(inputBalance);
  }, [inputCurrency, selectedGasPrice]);

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

  // Recalculate balance when gas price changes
  useEffect(() => {
    if (
      inputCurrency.address === 'eth' &&
      get(prevSelectedGasPrice, 'txFee.value.amount', 0) !==
        get(selectedGasPrice, 'txFee.value.amount', 0)
    ) {
      updateInputBalance();
    }
  }, [
    inputCurrency.address,
    prevSelectedGasPrice,
    selectedGasPrice,
    updateInputBalance,
  ]);

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
      handleRefocusLastInput();
    });

    return () => {
      refocusListener && refocusListener.remove();
    };
  }, [
    handleRefocusLastInput,
    inputCurrency,
    isScreenFocused,
    navigation,
    outputCurrency,
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
      getMarketDetails();
    }
  }, [
    defaultInputAddress,
    getMarketDetails,
    inputCurrency,
    isDeposit,
    isWithdrawal,
    nativeAmount,
  ]);

  useEffect(() => {
    if (
      (isDeposit || isWithdrawal) &&
      inputCurrency &&
      inputCurrency.address === defaultInputAddress
    )
      return;
    getMarketDetails();
  }, [
    defaultInputAddress,
    getMarketDetails,
    inputAmount,
    inputCurrency,
    inputCurrencyUniqueId,
    inputReserveTokenAddress,
    isDeposit,
    isWithdrawal,
    outputAmount,
    outputCurrencyUniqueId,
    outputReserveTokenAddress,
  ]);

  const getMarketPrice = useCallback(
    (useInputReserve = true) => {
      const ethPrice = ethereumUtils.getEthPriceUnit(allAssets);
      if (
        (useInputReserve && inputCurrency && inputCurrency.address === 'eth') ||
        (!useInputReserve && outputCurrency && outputCurrency.address === 'eth')
      )
        return ethPrice;

      if (
        (useInputReserve && !inputReserve) ||
        (!useInputReserve && !outputReserve)
      )
        return 0;

      const marketDetails = getUniswapMarketDetails(
        undefined,
        useInputReserve ? inputReserve : outputReserve
      );
      const assetToEthPrice = get(marketDetails, 'marketRate.rate');
      return divide(ethPrice, assetToEthPrice) || 0;
    },
    [allAssets, inputCurrency, inputReserve, outputCurrency, outputReserve]
  );

  const updateExtraTradeDetails = useCallback(
    tradeDetails => {
      let inputExecutionRate = '';
      let inputNativePrice = '';
      let outputExecutionRate = '';
      let outputNativePrice = '';

      if (inputCurrency) {
        const inputPriceValue = getMarketPrice();
        inputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rate', BigNumber(0)),
          inputPriceValue
        );

        inputNativePrice = convertAmountToNativeDisplay(
          inputPriceValue,
          nativeCurrency
        );
      }

      if (outputCurrency) {
        const outputPriceValue = getMarketPrice(false);
        outputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rateInverted', BigNumber(0)),
          outputPriceValue
        );

        outputNativePrice = convertAmountToNativeDisplay(
          outputPriceValue,
          nativeCurrency
        );
      }

      setExtraTradeDetails({
        inputExecutionRate,
        inputNativePrice,
        outputExecutionRate,
        outputNativePrice,
      });
    },
    [getMarketPrice, inputCurrency, nativeCurrency, outputCurrency]
  );

  const updateTradeDetails = useCallback(() => {
    let updatedInputAmount = inputAmount;
    let updatedInputAsExactAmount = inputAsExactAmount;
    const isMissingAmounts = !inputAmount && !outputAmount;

    if (isMissingAmounts) {
      const DEFAULT_NATIVE_INPUT_AMOUNT = 50;
      const inputNativePrice = getMarketPrice();
      updatedInputAmount = convertAmountFromNativeValue(
        DEFAULT_NATIVE_INPUT_AMOUNT,
        inputNativePrice,
        inputCurrency.decimals
      );
      updatedInputAsExactAmount = true;
    }

    return calculateTradeDetails(
      chainId,
      updatedInputAmount,
      inputCurrency,
      inputReserve,
      outputAmount,
      outputCurrency,
      outputReserve,
      updatedInputAsExactAmount
    );
  }, [
    chainId,
    getMarketPrice,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    inputReserve,
    outputAmount,
    outputCurrency,
    outputReserve,
  ]);

  const calculateInputGivenOutputChange = useCallback(
    (tradeDetails, isOutputEmpty, isOutputZero, inputDecimals) => {
      if (isOutputEmpty || isOutputZero) {
        updateInputAmount();
        setIsSufficientBalance(true);
      } else {
        const updatedInputAmount = get(tradeDetails, 'inputAmount.amount');
        const rawUpdatedInputAmount = convertRawAmountToDecimalFormat(
          updatedInputAmount,
          inputDecimals
        );

        const updatedInputAmountDisplay = updatePrecisionToDisplay(
          rawUpdatedInputAmount,
          get(inputCurrency, 'price.value'),
          true
        );
        updateInputAmount(
          rawUpdatedInputAmount,
          updatedInputAmountDisplay,
          inputAsExactAmount
        );

        const isSufficientAmountToTrade = greaterThanOrEqualTo(
          inputBalance,
          rawUpdatedInputAmount
        );
        setIsSufficientBalance(isSufficientAmountToTrade);
      }
    },
    [inputAsExactAmount, inputBalance, inputCurrency, updateInputAmount]
  );

  const calculateOutputGivenInputChange = useCallback(
    (tradeDetails, isInputEmpty, isInputZero, outputDecimals) => {
      logger.log('calculate OUTPUT given INPUT change');
      if (
        (isInputEmpty || isInputZero) &&
        outputFieldRef &&
        outputFieldRef.current &&
        !outputFieldRef.current.isFocused()
      ) {
        updateOutputAmount(null, null, true);
      } else {
        const updatedOutputAmount = get(tradeDetails, 'outputAmount.amount');
        const rawUpdatedOutputAmount = convertRawAmountToDecimalFormat(
          updatedOutputAmount,
          outputDecimals
        );
        if (rawUpdatedOutputAmount !== '0') {
          let outputNativePrice = get(outputCurrency, 'price.value', null);
          if (isNil(outputNativePrice)) {
            outputNativePrice = getMarketPrice(false);
          }
          const updatedOutputAmountDisplay = updatePrecisionToDisplay(
            rawUpdatedOutputAmount,
            outputNativePrice
          );

          updateOutputAmount(
            rawUpdatedOutputAmount,
            updatedOutputAmountDisplay,
            inputAsExactAmount
          );
        }
      }
    },
    [getMarketPrice, inputAsExactAmount, outputCurrency, updateOutputAmount]
  );

  const getMarketDetails = useCallback(() => {
    const isMissingCurrency = !inputCurrency || !outputCurrency;
    const isMissingReserves =
      (inputCurrency && inputCurrency.address !== 'eth' && !inputReserve) ||
      (outputCurrency && outputCurrency.address !== 'eth' && !outputReserve);
    if (isMissingCurrency || isMissingReserves) return;

    try {
      const tradeDetails = updateTradeDetails();
      updateExtraTradeDetails(tradeDetails);

      const isMissingAmounts = !inputAmount && !outputAmount;
      if (isMissingAmounts) return;

      const { decimals: inputDecimals } = inputCurrency;
      const { decimals: outputDecimals } = outputCurrency;

      // update slippage
      const slippage = convertNumberToString(
        get(tradeDetails, 'executionRateSlippage', 0)
      );
      setSlippage(slippage);

      const isSufficientBalance =
        !inputAmount || greaterThanOrEqualTo(inputBalance, inputAmount);

      setIsSufficientBalance(isSufficientBalance);

      const isInputEmpty = !inputAmount;
      const isNativeEmpty = !nativeAmount;
      const isOutputEmpty = !outputAmount;

      const isInputZero = Number(inputAmount) === 0;
      const isOutputZero = Number(outputAmount) === 0;

      if (
        nativeFieldRef &&
        nativeFieldRef.current &&
        nativeFieldRef.current.isFocused() &&
        isNativeEmpty &&
        !isMax
      ) {
        clearForm();
      }

      // update output amount given input amount changes
      if (inputAsExactAmount) {
        calculateOutputGivenInputChange(
          tradeDetails,
          isInputEmpty,
          isInputZero,
          outputDecimals
        );
      }

      // update input amount given output amount changes
      if (
        !inputAsExactAmount &&
        inputFieldRef &&
        inputFieldRef.current &&
        !inputFieldRef.current.isFocused()
      ) {
        calculateInputGivenOutputChange(
          tradeDetails,
          isOutputEmpty,
          isOutputZero,
          inputDecimals
        );
      }
    } catch (error) {
      logger.log('error getting market details', error);
    }
  }, [
    calculateInputGivenOutputChange,
    calculateOutputGivenInputChange,
    clearForm,
    inputAmount,
    inputAsExactAmount,
    inputBalance,
    inputCurrency,
    inputReserve,
    isMax,
    nativeAmount,
    outputAmount,
    outputCurrency,
    outputReserve,
    updateExtraTradeDetails,
    updateTradeDetails,
  ]);

  const assignInputFieldRef = useCallback(ref => {
    inputFieldRef.current = ref;
  }, []);

  const assignNativeFieldRef = useCallback(ref => {
    nativeFieldRef.current = ref;
  }, []);

  const assignOutputFieldRef = useCallback(ref => {
    outputFieldRef.current = ref;
  }, []);

  const findNextFocused = useCallback(() => {
    const inputRefTag = getNativeTag(inputFieldRef.current);
    const nativeInputRefTag = getNativeTag(nativeFieldRef.current);
    const outputRefTag = getNativeTag(outputFieldRef.current);

    const lastFocusedIsInputType =
      lastFocusedInput &&
      (lastFocusedInput.current === inputRefTag ||
        lastFocusedInput.current === nativeInputRefTag);

    const lastFocusedIsOutputType =
      lastFocusedInput && lastFocusedInput.current === outputRefTag;

    if (lastFocusedIsInputType && !inputCurrency) {
      return outputRefTag;
    }

    if (lastFocusedIsOutputType && !outputCurrency) {
      return inputRefTag;
    }

    return lastFocusedInput.current;
  }, [inputCurrency, lastFocusedInput, outputCurrency]);

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
          navigation.navigate('ProfileScreen');
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
        navigation.navigate('WalletScreen');
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

  const handleRefocusLastInput = useCallback(() => {
    createRefocusInteraction(() => {
      if (isScreenFocused) {
        TextInput.State.focusTextInput(findNextFocused());
      }
    });
  }, [createRefocusInteraction, findNextFocused, isScreenFocused]);

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
  }, [extraTradeDetails, inputCurrency, navigation, outputCurrency]);

  const navigateToSelectInputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.setParams({ focused: false });
      navigation.navigate('CurrencySelectScreen', {
        headerTitle: inputHeaderTitle,
        onSelectCurrency: updateInputCurrency,
        restoreFocusOnSwapModal: () => {
          navigation.setParams({ focused: true });
        },
        type: CurrencySelectionTypes.input,
      });
    });
  }, [inputHeaderTitle, navigation, updateInputCurrency]);

  const navigateToSelectOutputCurrency = useCallback(() => {
    logger.log('[nav to select output curr]', inputCurrency);
    InteractionManager.runAfterInteractions(() => {
      navigation.setParams({ focused: false });
      navigation.navigate('CurrencySelectScreen', {
        headerTitle: 'Receive',
        onSelectCurrency: updateOutputCurrency,
        restoreFocusOnSwapModal: () => {
          navigation.setParams({ focused: true });
        },
        type: CurrencySelectionTypes.output,
      });
    });
  }, [inputCurrency, navigation, updateOutputCurrency]);

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
            newNativePrice = getMarketPrice();
          }
          newNativeAmount = convertAmountToNativeAmount(
            newInputAmount,
            newNativePrice
          );
        }
        setNativeAmount(newNativeAmount);

        if (inputCurrency) {
          const isSufficientBalance =
            !newInputAmount ||
            (isWithdrawal
              ? greaterThanOrEqualTo(supplyBalanceUnderlying, newInputAmount)
              : greaterThanOrEqualTo(inputBalance, newInputAmount));

          setIsSufficientBalance(isSufficientBalance);
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
      supplyBalanceUnderlying,
      type,
    ]
  );

  const clearForm = useCallback(() => {
    if (inputFieldRef && inputFieldRef.current) inputFieldRef.current.clear();
    if (nativeFieldRef && nativeFieldRef.current)
      nativeFieldRef.current.clear();
    if (outputFieldRef && outputFieldRef.current)
      outputFieldRef.current.clear();
    updateInputAmount();
  }, [updateInputAmount]);

  const updateInputCurrency = useCallback(
    async (newInputCurrency, userSelected = true) => {
      logger.log(
        '[update input curr] new input curr, user selected?',
        newInputCurrency,
        userSelected
      );

      logger.log('[update input curr] prev input curr', previousInputCurrency);
      if (!isSameAsset(newInputCurrency, previousInputCurrency)) {
        logger.log('[update input curr] clear form');
        clearForm();
      }

      logger.log('[update input curr] setting input curr', newInputCurrency);
      setInputCurrency(newInputCurrency);
      setShowConfirmButton(
        isDeposit || isWithdrawal
          ? !!newInputCurrency
          : !!newInputCurrency && !!outputCurrency
      );

      dispatch(uniswapUpdateInputCurrency(newInputCurrency));

      if (userSelected && isSameAsset(newInputCurrency, outputCurrency)) {
        logger.log(
          '[update input curr] setting output curr to prev input curr'
        );
        if (isDeposit || isWithdrawal) {
          updateOutputCurrency(null, false);
        } else {
          updateOutputCurrency(previousInputCurrency, false);
        }
      }

      if (isDeposit && newInputCurrency.address !== defaultInputAddress) {
        logger.log(
          '[update input curr] new deposit output for deposit or withdraw',
          defaultChosenInputItem
        );
        updateOutputCurrency(defaultChosenInputItem, false);
      }

      // Update current balance
      const inputBalance = await ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        newInputCurrency
      );
      setInputBalance(inputBalance);

      analytics.track('Switched input asset', {
        category: isDeposit ? 'savings' : 'swap',
        defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
        from: (previousInputCurrency && previousInputCurrency.symbol) || '',
        label: newInputCurrency.symbol,
        type,
      });
    },
    [
      clearForm,
      defaultChosenInputItem,
      defaultInputAddress,
      defaultInputAsset,
      dispatch,
      isDeposit,
      isWithdrawal,
      outputCurrency,
      previousInputCurrency,
      selectedGasPrice,
      type,
      uniswapUpdateInputCurrency,
      updateOutputCurrency,
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
          nativePrice = getMarketPrice();
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
    [getMarketPrice, inputCurrency]
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

  const updateOutputCurrency = useCallback(
    (newOutputCurrency, userSelected = true) => {
      logger.log(
        '[update output curr] new output curr, user selected?',
        newOutputCurrency,
        userSelected
      );
      logger.log(
        '[update output curr] input currency at the moment',
        inputCurrency
      );
      dispatch(uniswapUpdateOutputCurrency(newOutputCurrency));

      setInputAsExactAmount(true);
      setOutputCurrency(newOutputCurrency);
      setShowConfirmButton(
        isDeposit || isWithdrawal
          ? !!inputCurrency
          : !!inputCurrency && !!newOutputCurrency
      );

      logger.log(
        '[update output curr] prev output curr',
        previousOutputCurrency
      );
      const existsInWallet = find(
        uniswapAssetsInWallet,
        asset =>
          get(asset, 'address') === get(previousOutputCurrency, 'address')
      );
      if (userSelected && isSameAsset(inputCurrency, newOutputCurrency)) {
        if (existsInWallet) {
          logger.log(
            '[update output curr] updating input curr with prev output curr'
          );
          updateInputCurrency(previousOutputCurrency, false);
        } else {
          logger.log('[update output curr] updating input curr with nothing');
          updateInputCurrency(null, false);
        }
      }

      analytics.track('Switched output asset', {
        category: isWithdrawal || isDeposit ? 'savings' : 'swap',
        defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
        from: (previousOutputCurrency && previousOutputCurrency.symbol) || null,
        label: newOutputCurrency.symbol,
        type,
      });
    },
    [
      defaultInputAsset,
      dispatch,
      inputCurrency,
      isDeposit,
      isWithdrawal,
      previousOutputCurrency,
      type,
      uniswapAssetsInWallet,
      uniswapUpdateOutputCurrency,
      updateInputCurrency,
    ]
  );

  const isSlippageWarningVisible =
    isSufficientBalance && !!inputAmount && !!outputAmount;

  const {
    inputExecutionRate,
    inputNativePrice,
    outputExecutionRate,
    outputNativePrice,
  } = extraTradeDetails;

  const showDetailsButton = useMemo(() => {
    return (
      !(isDeposit || isWithdrawal) &&
      get(inputCurrency, 'symbol') &&
      get(outputCurrency, 'symbol') &&
      inputExecutionRate !== 'NaN' &&
      inputExecutionRate &&
      inputNativePrice &&
      outputExecutionRate !== 'NaN' &&
      outputExecutionRate &&
      outputNativePrice
    );
  }, [
    inputCurrency,
    inputExecutionRate,
    inputNativePrice,
    isDeposit,
    isWithdrawal,
    outputCurrency,
    outputExecutionRate,
    outputNativePrice,
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
