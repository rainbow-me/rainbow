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
import { TextInput, InteractionManager } from 'react-native';
import Animated from 'react-native-reanimated';
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
import GestureBlocker from '../components/GestureBlocker';
import {
  Centered,
  Column,
  KeyboardFixedOpenLayout,
} from '../components/layout';
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
  useMagicFocus,
  usePrevious,
  useUniswapAssetsInWallet,
} from '../hooks';
import { loadWallet } from '../model/wallet';
import { executeRap } from '../raps/common';
import ethUnits from '../references/ethereum-units.json';
import { colors, padding, position } from '../styles';
import { ethereumUtils } from '../utils';
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
  defaultInputAsset,
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateDefaultGasLimit,
  gasUpdateTxFee,
  inputHeaderTitle,
  inputReserve,
  isTransitioning,
  navigation,
  outputReserve,
  createRap,
  selectedGasPrice,
  showOutputField,
  tabPosition,
  type,
  underlyingPrice,
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
  web3ListenerInit,
  web3ListenerStop,
}) => {
  const isDeposit = type === ExchangeModalTypes.deposit;
  const isWithdrawal = type === ExchangeModalTypes.withdrawal;

  const { allAssets } = useAccountAssets();
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

  const inputFieldRef = useRef();
  const nativeFieldRef = useRef();
  const outputFieldRef = useRef();

  const [lastFocusedInput, handleFocus] = useMagicFocus(inputFieldRef.current);

  useEffect(() => {
    console.log('[effect 1] gasPrices');
    gasUpdateDefaultGasLimit(
      isDeposit
        ? ethUnits.basic_deposit
        : isWithdrawal
        ? ethUnits.basic_withdrawal
        : ethUnits.basic_swap
    );
    gasPricesStartPolling();
    web3ListenerInit();
    return () => {
      uniswapClearCurrenciesAndReserves();
      gasPricesStopPolling();
      web3ListenerStop();
    };
  }, [
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
    console.log('getting trade details');
    console.log('> input amount', inputAmount);
    console.log('> native amount', nativeAmount);
    console.log('> output amount', outputAmount);
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
    nativeAmount,
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
      console.log('calculate OUTPUT given INPUT change');
      console.log('> input amount', inputAmount);
      console.log('> native amount', nativeAmount);
      console.log('> output amount', outputAmount);
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
    [
      getMarketPrice,
      inputAmount,
      inputAsExactAmount,
      nativeAmount,
      outputAmount,
      outputCurrency,
    ]
  );

  const getMarketDetails = useCallback(async () => {
    const isMissingCurrency = !inputCurrency || !outputCurrency;
    const isMissingReserves =
      (inputCurrency && inputCurrency.address !== 'eth' && !inputReserve) ||
      (outputCurrency && outputCurrency.address !== 'eth' && !outputReserve);
    if (isMissingCurrency || isMissingReserves) return;

    try {
      const tradeDetails = updateTradeDetails();
      console.log('Trade details', tradeDetails);
      console.log(
        'Trade details - input',
        tradeDetails.inputAmount.amount.toFixed()
      );
      console.log(
        'Trade details - output',
        tradeDetails.outputAmount.amount.toFixed()
      );
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
        gasUpdateTxFee(gasLimit);
      } catch (error) {
        gasUpdateTxFee(ethUnits.basic_swap);
      }
    } catch (error) {
      console.log('error getting market details', error);
    }
  }, [
    accountAddress,
    calculateInputGivenOutputChange,
    calculateOutputGivenInputChange,
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

  const clearForm = () => {
    if (inputFieldRef && inputFieldRef.current) inputFieldRef.current.clear();
    if (nativeFieldRef && nativeFieldRef.current)
      nativeFieldRef.current.clear();
    if (outputFieldRef && outputFieldRef.current)
      outputFieldRef.current.clear();
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
    console.log('[max] selectedGasPrice', selectedGasPrice);
    console.log('[max] inputCurrency', inputCurrency);
    const maxBalance = ethereumUtils.getBalanceAmount(
      selectedGasPrice,
      inputCurrency
    );
    console.log('[max] maxBalance', maxBalance);

    return updateInputAmount(maxBalance);
  };

  const handleSubmit = async () => {
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
        inputAmount,
        inputAsExactAmount,
        inputCurrency,
        outputAmount,
        outputCurrency,
        selectedGasPrice: null,
      });
      console.log('[exchange - handle submit] rap', rap);
      executeRap(wallet, rap);
      console.log('[exchange - handle submit] executed rap!');
    } catch (error) {
      setIsAuthorizing(false);
      console.log('[exchange - handle submit] error submitting swap', error);
      navigation.setParams({ focused: false });
      navigation.navigate('WalletScreen');
    }
  };

  const handleRefocusLastInput = () => {
    InteractionManager.runAfterInteractions(() => {
      TextInput.State.focusTextInput(findNextFocused());
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
    console.log('[nav to select output curr]', inputCurrency);
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
    (newInputAmount, newAmountDisplay, newInputAsExactAmount = true) => {
      console.log(
        '[update input amount]',
        newInputAmount,
        newInputAsExactAmount
      );
      setInputAmount(newInputAmount);
      setInputAsExactAmount(newInputAsExactAmount);
      setInputAmountDisplay(
        newAmountDisplay !== undefined ? newAmountDisplay : newInputAmount
      );

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
      }
    },
    [getMarketPrice, inputCurrency]
  );

  const previousInputCurrency = usePrevious(inputCurrency);

  const updateInputCurrency = (newInputCurrency, userSelected = true) => {
    console.log(
      '[update input curr] new input curr, user selected?',
      newInputCurrency,
      userSelected
    );
    console.log('[update input curr] prev input curr', previousInputCurrency);
    if (!isSameAsset(newInputCurrency, previousInputCurrency)) {
      console.log('[update input curr] clear form');
      clearForm();
    }

    console.log('[update input curr] setting input curr', newInputCurrency);
    setInputCurrency(newInputCurrency);
    setShowConfirmButton(
      isDeposit || isWithdrawal
        ? !!newInputCurrency
        : !!newInputCurrency && !!outputCurrency
    );

    uniswapUpdateInputCurrency(newInputCurrency);

    if (userSelected && isSameAsset(newInputCurrency, outputCurrency)) {
      console.log('[update input curr] setting output curr to prev input curr');
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
  };

  const updateNativeAmount = nativeAmount => {
    console.log('update native amount', nativeAmount);
    let inputAmount = null;
    let inputAmountDisplay = null;

    const isNativeZero = isZero(nativeAmount);
    setNativeAmount(nativeAmount);

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

  const updateOutputAmount = (
    newOutputAmount,
    newAmountDisplay,
    newInputAsExactAmount = false
  ) => {
    console.log('update output amt', newInputAsExactAmount);
    setOutputAmount(newOutputAmount);
    setOutputAmountDisplay(
      newAmountDisplay !== undefined ? newAmountDisplay : newOutputAmount
    );
    setInputAsExactAmount(newInputAsExactAmount);
  };

  const previousOutputCurrency = usePrevious(outputCurrency);

  const updateOutputCurrency = (newOutputCurrency, userSelected = true) => {
    console.log(
      '[update output curr] new output curr, user selected?',
      newOutputCurrency,
      userSelected
    );
    console.log(
      '[update output curr] input currency at the moment',
      inputCurrency
    );
    uniswapUpdateOutputCurrency(newOutputCurrency);

    setInputAsExactAmount(true);
    setOutputCurrency(newOutputCurrency);
    setShowConfirmButton(
      isDeposit || isWithdrawal
        ? !!inputCurrency
        : !!inputCurrency && !!newOutputCurrency
    );

    console.log(
      '[update output curr] prev output curr',
      previousOutputCurrency
    );
    const existsInWallet = find(
      uniswapAssetsInWallet,
      asset => get(asset, 'address') === get(previousOutputCurrency, 'address')
    );
    if (userSelected && isSameAsset(inputCurrency, newOutputCurrency)) {
      if (existsInWallet) {
        console.log(
          '[update output curr] updating input curr with prev output curr'
        );
        updateInputCurrency(previousOutputCurrency, false);
      } else {
        console.log('[update output curr] updating input curr with nothing');
        updateInputCurrency(null, false);
      }
    }
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
            <GestureBlocker type="top" />
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
              <GasSpeedButton />
            </Fragment>
          )}
          <Column>
            <GestureBlocker type="bottom" />
          </Column>
        </AnimatedFloatingPanels>
      </Centered>
    </KeyboardFixedOpenLayout>
  );
};

ExchangeModal.propTypes = {
  createRap: PropTypes.func,
  defaultInputAddress: PropTypes.string,
  gasPricesStartPolling: PropTypes.func,
  gasPricesStopPolling: PropTypes.func,
  gasUpdateDefaultGasLimit: PropTypes.func,
  gasUpdateTxFee: PropTypes.func,
  inputHeaderTitle: PropTypes.string,
  inputReserve: PropTypes.object,
  navigation: PropTypes.object,
  outputReserve: PropTypes.object,
  selectedGasPrice: PropTypes.object,
  tabPosition: PropTypes.object, // animated value
  tradeDetails: PropTypes.object,
  type: PropTypes.oneOf(Object.values(ExchangeModalTypes)),
  underlyingPrice: PropTypes.string,
  uniswapAssetsInWallet: PropTypes.arrayOf(PropTypes.object),
  uniswapUpdateInputCurrency: PropTypes.func,
  uniswapUpdateOutputCurrency: PropTypes.func,
  web3ListenerInit: PropTypes.func,
  web3ListenerStop: PropTypes.func,
};

export default ExchangeModal;
