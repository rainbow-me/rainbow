import analytics from '@segment/analytics-react-native';
import { getMarketDetails as getUniswapMarketDetails } from '@uniswap/sdk';
import BigNumber from 'bignumber.js';
import { find, get, isNil, toLower } from 'lodash';
import PropTypes from 'prop-types';
import React, {
  Fragment,
  useCallback,
  useEffect,
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
import { FloatingPanel, FloatingPanels } from '../components/expanded-state';
import { GasSpeedButton } from '../components/gas';
import { Centered, KeyboardFixedOpenLayout } from '../components/layout';
import {
  calculateTradeDetails,
  estimateSwapGasLimit,
} from '../handlers/uniswap';
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
import ethUnits from '../references/ethereum-units.json';
import { colors, padding, position } from '../styles';
import { backgroundTask, ethereumUtils, logger } from '../utils';
import { CurrencySelectionTypes } from './CurrencySelectModal';
import SwapInfo from '../components/exchange/SwapInfo';

export const exchangeModalBorderRadius = 30;

const AnimatedFloatingPanels = Animated.createAnimatedComponent(
  toClass(FloatingPanels)
);

const isSameAsset = (a, b) => {
  if (!a || !b) return false;
  const assetA = toLower(get(a, 'address', ''));
  const assetB = toLower(get(b, 'address', ''));
  return assetA === assetB;
};

const getNativeTag = field => get(field, '_inputRef._nativeTag');

const createMissingWithdrawalAsset = (asset, underlyingPrice, priceOfEther) => {
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
  inputHeaderTitle,
  isTransitioning,
  navigation,
  createRap,
  selectedGasPrice,
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
  const { accountAddress, chainId, nativeCurrency } = useAccountSettings();

  const defaultInputAddress = get(defaultInputAsset, 'address');
  let defaultInputItem = ethereumUtils.getAsset(allAssets, defaultInputAddress);
  if (!defaultInputItem && isWithdrawal) {
    const eth = ethereumUtils.getAsset(allAssets);
    const priceOfEther = get(eth, 'native.price.amount', null);
    defaultInputItem = createMissingWithdrawalAsset(
      defaultInputAsset,
      underlyingPrice,
      priceOfEther
    );
  } else if (!defaultInputItem) {
    defaultInputItem = ethereumUtils.getAsset(allAssets);
  }
  const [inputCurrency, setInputCurrency] = useState(defaultInputItem);
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
  const [outputCurrency, setOutputCurrency] = useState(null);
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
  }, [
    dispatch,
    gasPricesStartPolling,
    gasPricesStopPolling,
    gasUpdateDefaultGasLimit,
    isDeposit,
    isWithdrawal,
    uniswapClearCurrenciesAndReserves,
    web3ListenerInit,
    web3ListenerStop,
  ]);

  const inputCurrencyUniqueId = get(inputCurrency, 'uniqueId');
  const outputCurrencyUniqueId = get(outputCurrency, 'uniqueId');

  const inputReserveTokenAddress = get(inputReserve, 'token.address');
  const outputReserveTokenAddress = get(outputReserve, 'token.address');

  useEffect(() => {
    if (!isTransitioning) {
      navigation.emit('refocus');
    }
  }, [isTransitioning, navigation]);

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
    (
      tradeDetails,
      isOutputEmpty,
      isOutputZero,
      inputDecimals,
      inputBalance
    ) => {
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

        setIsSufficientBalance(
          greaterThanOrEqualTo(inputBalance, rawUpdatedInputAmount)
        );
      }
    },
    [inputAsExactAmount, inputCurrency, updateInputAmount]
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

  const getMarketDetails = useCallback(async () => {
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

      // update sufficient balance
      const inputBalance = ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        inputCurrency
      );

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
        isNativeEmpty
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
          inputDecimals,
          inputBalance
        );
      }

      // update gas fee estimate
      try {
        const gasLimit = await estimateSwapGasLimit(
          accountAddress,
          tradeDetails
        );
        dispatch(gasUpdateTxFee(gasLimit));
      } catch (error) {
        dispatch(gasUpdateTxFee(ethUnits.basic_swap));
      }
    } catch (error) {
      logger.log('error getting market details', error);
    }
  }, [
    accountAddress,
    calculateInputGivenOutputChange,
    calculateOutputGivenInputChange,
    clearForm,
    dispatch,
    gasUpdateTxFee,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    inputReserve,
    nativeAmount,
    outputAmount,
    outputCurrency,
    outputReserve,
    selectedGasPrice,
    updateExtraTradeDetails,
    updateTradeDetails,
  ]);

  const assignInputFieldRef = ref => {
    inputFieldRef.current = ref;
  };

  const assignNativeFieldRef = ref => {
    nativeFieldRef.current = ref;
  };

  const assignOutputFieldRef = ref => {
    outputFieldRef.current = ref;
  };

  const findNextFocused = () => {
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
  };

  const handlePressMaxBalance = () => {
    let maxBalance;
    if (isWithdrawal) {
      maxBalance = supplyBalanceUnderlying;
    } else {
      maxBalance = ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        inputCurrency
      );
    }

    analytics.track('Selected max balance', {
      category: isDeposit || isWithdrawal ? 'savings' : 'swap',
      defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
      type,
      value: Number(maxBalance.toString()),
    });

    return updateInputAmount(maxBalance, maxBalance, true, true);
  };

  const handleSubmit = () => {
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
        const rap = createRap({
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
  };

  const handleRefocusLastInput = () => {
    createRefocusInteraction(() => {
      if (isScreenFocused) {
        TextInput.State.focusTextInput(findNextFocused());
      }
    });
  };

  const navigateToSwapDetailsModal = () => {
    inputFieldRef.current.blur();
    outputFieldRef.current.blur();
    nativeFieldRef.current.blur();
    navigation.setParams({ focused: false });
    navigation.navigate('SwapDetailsScreen', {
      ...extraTradeDetails,
      inputCurrencySymbol: get(inputCurrency, 'symbol'),
      onRefocusInput: handleRefocusLastInput,
      outputCurrencySymbol: get(outputCurrency, 'symbol'),
      restoreFocusOnSwapModal: () => {
        navigation.setParams({ focused: true });
      },
      type: 'swap_details',
    });
  };

  const navigateToSelectInputCurrency = () => {
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
  };

  const navigateToSelectOutputCurrency = () => {
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
  };

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
      setIsMax(newIsMax);

      if (!nativeFieldRef.current.isFocused()) {
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

        // update sufficient balance
        if (inputCurrency) {
          const inputBalance = ethereumUtils.getBalanceAmount(
            selectedGasPrice,
            inputCurrency
          );

          const isSufficientBalance =
            !newInputAmount ||
            (isWithdrawal
              ? greaterThanOrEqualTo(supplyBalanceUnderlying, newInputAmount)
              : greaterThanOrEqualTo(inputBalance, newInputAmount));
          setIsSufficientBalance(isSufficientBalance);
        }

        if (newAmountDisplay) {
          analytics.track('Updated input amount', {
            category: isDeposit ? 'savings' : 'swap',
            defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
            type,
            value: Number(newAmountDisplay.toString()),
          });
        }
      }
    },
    [
      defaultInputAsset,
      getMarketPrice,
      inputCurrency,
      isDeposit,
      isWithdrawal,
      selectedGasPrice,
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

  const updateInputCurrency = (newInputCurrency, userSelected = true) => {
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
      logger.log('[update input curr] setting output curr to prev input curr');
      if (isDeposit || isWithdrawal) {
        updateOutputCurrency(null, false);
      } else {
        updateOutputCurrency(previousInputCurrency, false);
      }
    }

    if (
      (isDeposit || isWithdrawal) &&
      newInputCurrency.address !== defaultInputAddress
    ) {
      const newDepositOutput = ethereumUtils.getAsset(
        allAssets,
        defaultInputAddress
      );
      updateOutputCurrency(newDepositOutput, false);
    }

    analytics.track('Switched input asset', {
      category: isDeposit ? 'savings' : 'swap',
      defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
      from: previousInputCurrency.symbol,
      label: newInputCurrency.symbol,
      type,
    });
  };

  const updateNativeAmount = nativeAmount => {
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
  };

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

  const updateOutputCurrency = (newOutputCurrency, userSelected = true) => {
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

    logger.log('[update output curr] prev output curr', previousOutputCurrency);
    const existsInWallet = find(
      uniswapAssetsInWallet,
      asset => get(asset, 'address') === get(previousOutputCurrency, 'address')
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
  };

  const isSlippageWarningVisible =
    isSufficientBalance && !!inputAmount && !!outputAmount;

  const {
    inputExecutionRate,
    inputNativePrice,
    outputExecutionRate,
    outputNativePrice,
  } = extraTradeDetails;

  const showDetailsButton =
    !(isDeposit || isWithdrawal) &&
    get(inputCurrency, 'symbol') &&
    get(outputCurrency, 'symbol') &&
    inputExecutionRate !== 'NaN' &&
    inputExecutionRate &&
    inputNativePrice &&
    outputExecutionRate !== 'NaN' &&
    outputExecutionRate &&
    outputNativePrice;

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
  inputHeaderTitle: PropTypes.string,
  navigation: PropTypes.object,
  selectedGasPrice: PropTypes.object,
  supplyBalanceUnderlying: PropTypes.string,
  tabPosition: PropTypes.object, // animated value
  tradeDetails: PropTypes.object,
  type: PropTypes.oneOf(Object.values(ExchangeModalTypes)),
  underlyingPrice: PropTypes.string,
};

export default ExchangeModal;
