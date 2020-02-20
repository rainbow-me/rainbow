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
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToNativeDisplay,
  convertNumberToString,
  convertRawAmountToDecimalFormat,
  divide,
  greaterThanOrEqualTo,
  isZero,
  subtract,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import { useAccountData, useMagicFocus, usePrevious } from '../hooks';
import { loadWallet } from '../model/wallet';
import swapOnUniswap from '../raps/swap-uniswap';
import ethUnits from '../references/ethereum-units.json';
import { colors, padding, position } from '../styles';
import { ethereumUtils } from '../utils';
import { CurrencySelectionTypes } from './CurrencySelectModal';

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

const ExchangeModal = ({
  defaultInputAddress,
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateDefaultGasLimit,
  gasUpdateTxFee,
  inputHeaderTitle,
  inputReserve,
  isTransitioning,
  navigation,
  outputReserve,
  selectedGasPrice,
  showOutputField,
  tabPosition,
  uniswapAssetsInWallet,
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
  web3ListenerInit,
  web3ListenerStop,
}) => {
  const {
    accountAddress,
    allAssets,
    chainId,
    nativeCurrency,
  } = useAccountData();

  const [inputAmount, setInputAmount] = useState(null);
  const [inputAmountDisplay, setInputAmountDisplay] = useState(null);
  const [inputAsExactAmount, setInputAsExactAmount] = useState(true);
  const [inputCurrency, setInputCurrency] = useState(
    ethereumUtils.getAsset(allAssets, defaultInputAddress)
  );

  const [extraTradeDetails, setExtraTradeDetails] = useState({});
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSufficientBalance, setIsSufficientBalance] = useState(true);
  const [nativeAmount, setNativeAmount] = useState(null);
  const [outputAmount, setOutputAmount] = useState(null);
  const [outputAmountDisplay, setOutputAmountDisplay] = useState(null);
  const [outputCurrency, setOutputCurrency] = useState(null);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [slippage, setSlippage] = useState(null);

  const inputFieldRef = useRef();
  const nativeFieldRef = useRef();
  const outputFieldRef = useRef();

  const [lastFocusedInput, handleFocus] = useMagicFocus(inputFieldRef.current);

  useEffect(() => {
    gasUpdateDefaultGasLimit(ethUnits.basic_swap);
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
    const isNewNativeAmount = nativeFieldRef.current.isFocused();
    if (isNewNativeAmount) {
      getMarketDetails();
    }
  }, [getMarketDetails, nativeAmount]);

  useEffect(() => {
    getMarketDetails();
  }, [
    getMarketDetails,
    inputAmount,
    inputCurrencyUniqueId,
    inputReserveTokenAddress,
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
    let maxBalance = get(inputCurrency, 'balance.amount', 0);
    if (inputCurrency.address === 'eth') {
      maxBalance = subtract(maxBalance, 0.01);
    }

    return updateInputAmount(maxBalance);
  };

  // TODO JIN handle submit
  const handleSubmit = async () => {
    setIsAuthorizing(true);
    try {
      const wallet = await loadWallet();
      setIsAuthorizing(false);
      // const gasPrice = get(selectedGasPrice, 'value.amount');
      const { swap, rap } = await swapOnUniswap(
        wallet,
        inputCurrency,
        outputCurrency,
        inputAmount,
        outputAmount,
        null,
        inputAsExactAmount
      );

      // TODO JIN should we reveal all approval txns? txn parsers
      /*
      if (txn) {
        dataAddNewTransaction({
          amount: inputAmount,
          asset: inputCurrency,
          from: accountAddress,
          hash: txn.hash,
          nonce: get(txn, 'nonce'),
          to: get(txn, 'to'),
        });
        navigation.setParams({ focused: false });
        navigation.navigate('ProfileScreen');
      }
    */
    } catch (error) {
      setIsAuthorizing(false);
      console.log('error submitting swap', error);
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
      newInputAmount = null,
      newAmountDisplay = null,
      newInputAsExactAmount = true
    ) => {
      console.log('update input amount', newInputAmount, newInputAsExactAmount);
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

  const updateInputCurrency = (inputCurrency, userSelected = true) => {
    if (!isSameAsset(inputCurrency, previousInputCurrency)) {
      clearForm();
    }

    setInputCurrency(inputCurrency);
    setShowConfirmButton(!!inputCurrency && !!outputCurrency);

    uniswapUpdateInputCurrency(inputCurrency);

    if (userSelected && isSameAsset(inputCurrency, outputCurrency)) {
      updateOutputCurrency(previousInputCurrency, false);
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
    newOutputAmount = null,
    newAmountDisplay = null,
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

  const updateOutputCurrency = (outputCurrency, userSelected = true) => {
    uniswapUpdateOutputCurrency(outputCurrency);

    setInputAsExactAmount(true);
    setOutputCurrency(outputCurrency);
    setShowConfirmButton(!!inputCurrency && !!outputCurrency);

    const existsInWallet = find(
      uniswapAssetsInWallet,
      asset => get(asset, 'address') === get(previousOutputCurrency, 'address')
    );
    if (userSelected && isSameAsset(inputCurrency, outputCurrency)) {
      if (existsInWallet) {
        updateInputCurrency(previousOutputCurrency, false);
      } else {
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
    !showOutputField &&
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
              inputAmount={inputAmountDisplay}
              inputCurrencyAddress={get(inputCurrency, 'address', null)}
              inputCurrencySymbol={get(inputCurrency, 'symbol', null)}
              inputFieldRef={assignInputFieldRef}
              nativeAmount={nativeAmount}
              nativeCurrency={nativeCurrency}
              nativeFieldRef={assignNativeFieldRef}
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
                outputFieldRef={assignOutputFieldRef}
                setOutputAmount={updateOutputAmount}
              />
            )}
          </FloatingPanel>
          {isSlippageWarningVisible && <SlippageWarning slippage={slippage} />}
          {showConfirmButton && (
            <Fragment>
              <Centered css={padding(24, 15, 0)} flexShrink={0} width="100%">
                <ConfirmExchangeButton
                  disabled={!Number(inputAmountDisplay)}
                  isAuthorizing={isAuthorizing}
                  isSufficientBalance={isSufficientBalance}
                  onSubmit={handleSubmit}
                  slippage={slippage}
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
  uniswapAssetsInWallet: PropTypes.arrayOf(PropTypes.object),
  uniswapUpdateInputCurrency: PropTypes.func,
  uniswapUpdateOutputCurrency: PropTypes.func,
  web3ListenerInit: PropTypes.func,
  web3ListenerStop: PropTypes.func,
};

export default ExchangeModal;
