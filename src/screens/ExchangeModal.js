import {
  getMarketDetails as getUniswapMarketDetails,
  tradeEthForExactTokensWithData,
  tradeExactEthForTokensWithData,
  tradeExactTokensForEthWithData,
  tradeExactTokensForTokensWithData,
  tradeTokensForExactEthWithData,
  tradeTokensForExactTokensWithData,
} from '@uniswap/sdk';
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
import { estimateSwapGasLimit, executeSwap } from '../handlers/uniswap';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToNativeDisplay,
  convertAmountToRawAmount,
  convertNumberToString,
  convertRawAmountToDecimalFormat,
  divide,
  greaterThan,
  greaterThanOrEqualTo,
  isZero,
  subtract,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import { usePrevious } from '../hooks';
import ethUnits from '../references/ethereum-units.json';
import { colors, padding, position } from '../styles';
import { contractUtils, ethereumUtils, gasUtils } from '../utils';
import { CurrencySelectionTypes } from './CurrencySelectModal';

export const exchangeModalBorderRadius = 30;

const AnimatedFloatingPanels = Animated.createAnimatedComponent(
  toClass(FloatingPanels)
);

// TODO JIN
// first update ExchangeModal with the new props
// inputHeaderTitle (Swap or Deposit)
// focus stuff
// pass in the defaultInputAddress
// pass in showOutputField
// pass in the confirmation function
// use accountData
// need to swap or not?

const isSameAsset = (a, b) => {
  if (!a || !b) return false;
  const assetA = toLower(get(a, 'address', ''));
  const assetB = toLower(get(b, 'address', ''));
  return assetA === assetB;
};

const DEFAULT_APPROVAL_ESTIMATION_TIME_IN_MS = 30000; // 30 seconds

const getNativeTag = field => get(field, '_inputRef._nativeTag');

const ExchangeModal = ({
  accountAddress,
  allAssets,
  allowances,
  chainId,
  dataAddNewTransaction,
  defaultInputAddress, // TODO JIN
  gasLimit,
  gasPrices,
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateDefaultGasLimit,
  gasUpdateTxFee,
  inputHeaderTitle, // TODO JIN
  inputReserve,
  isTransitioning,
  nativeCurrency,
  navigation,
  outputReserve,
  pendingApprovals,
  selectedGasPrice,
  showOutputField,
  tabPosition,
  // tradeDetails, // TODO JIN
  uniswapAddPendingApproval,
  uniswapAssetsInWallet,
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateAllowances,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
  web3ListenerInit,
  web3ListenerStop,
}) => {
  console.log('what about the nav', navigation);
  console.log('what about the header', inputHeaderTitle);
  const [approvalCreationTimestamp, setApprovalCreationTimestamp] = useState(
    null
  );
  const [estimatedApprovalTimeInMs, setEstimatedApprovalTimeInMs] = useState(
    null
  );
  // const [inputAllowance, setInputAllowance] = useState(null);
  const [inputAmount, setInputAmount] = useState(null);
  const [inputAmountDisplay, setInputAmountDisplay] = useState(null);
  const [inputAsExactAmount, setInputAsExactAmount] = useState(true);
  const [inputCurrency, setInputCurrency] = useState(
    ethereumUtils.getAsset(allAssets, defaultInputAddress)
  );
  const [inputExecutionRate, setInputExecutionRate] = useState(null);
  const [inputNativePrice, setInputNativePrice] = useState(null);
  const [isAssetApproved, setIsAssetApproved] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSufficientBalance, setIsSufficientBalance] = useState(true);
  const [isUnlockingAsset, setIsUnlockingAsset] = useState(false);
  const [nativeAmount, setNativeAmount] = useState(null);
  const [outputAmount, setOutputAmount] = useState(null);
  const [outputAmountDisplay, setOutputAmountDisplay] = useState(null);
  const [outputCurrency, setOutputCurrency] = useState(null);
  const [outputExecutionRate, setOutputExecutionRate] = useState(null);
  const [outputNativePrice, setOutputNativePrice] = useState(null);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [slippage, setSlippage] = useState(null);
  const [tradeDetails, setTradeDetails] = useState(null);

  // const inputFocusInteractionHandle = useRef(null);
  const lastFocusedInput = useRef();
  const inputFieldRef = useRef();
  const nativeFieldRef = useRef();
  const outputFieldRef = useRef();

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

  /*
  useEffect(() => {
    console.log('use effect!');
    // const someCopy = inputFocusInteractionHandle.current;
    navigation.setParams({ focused: true });
    return () => {
      if (someCopy) {
        InteractionManager.clearInteractionHandle(someCopy);
      }
    };
  }, [
    navigation,
  ]);
  */

  /*
  shouldComponentUpdate = (nextProps, nextState) => {
    const isFocused = navigation.getParam('focused', false);
    const willBeFocused = nextProps.navigation.getParam('focused', false);

    const isNewProps = isNewValueForObjectPaths(this.props, nextProps, [
      'inputReserve.token.address',
      'outputReserve.token.address',
      'pendingApprovals',
    ]);

    // Code below is a workaround. We noticed that opening keyboard while animation
    // (with autofocus) can lead to frame drops. In order not to limit this
    // I manually can focus instead of relying on built-in autofocus.
    // Maybe that's not perfect, but works for now ¯\_(ツ)_/¯
    if (
      (isTransitioning &&
        !nextProps.isTransitioning &&
        (lastFocusedInput && lastFocusedInput.current === null)) ||
      (!isFocused && willBeFocused)
    ) {
      inputFocusInteractionHandle.current = InteractionManager.runAfterInteractions(
        focusInputField
      );
    }

    const isNewState = isNewValueForObjectPaths(this.state, nextState, [
      'approvalCreationTimestamp',
      'estimatedApprovalTimeInMs',
      'inputAmount',
      'inputCurrency.uniqueId',
      'inputExecutionRate',
      'inputNativePrice',
      'isAssetApproved',
      'isAuthorizing',
      'isSufficientBalance',
      'isUnlockingAsset',
      'nativeAmount',
      'outputAmount',
      'outputExecutionRate',
      'outputNativePrice',
      'outputCurrency.uniqueId',
      'slippage',
    ]);

    return isNewProps || isNewState;
  };
  */

  const prevIsTransitioning = usePrevious(isTransitioning);
  const prevInputAmount = usePrevious(inputAmount);
  const prevOutputAmount = usePrevious(outputAmount);
  const inputCurrencyUniqueId = get(inputCurrency, 'uniqueId');
  const outputCurrencyUniqueId = get(outputCurrency, 'uniqueId');

  const prevInputCurrencyUniqueId = usePrevious(inputCurrencyUniqueId);
  const prevOutputCurrencyUniqueId = usePrevious(outputCurrencyUniqueId);
  const prevNativeAmount = usePrevious(nativeAmount);
  const inputReserveTokenAddress = get(inputReserve, 'token.address');
  const outputReserveTokenAddress = get(outputReserve, 'token.address');

  const prevInputReserveTokenAddress = usePrevious(inputReserveTokenAddress);
  const prevOutputReserveTokenAddress = usePrevious(outputReserveTokenAddress);
  const inputCurrencyAddress = toLower(get(inputCurrency, 'address'));
  const prevInputCurrencyAddress = usePrevious(inputCurrencyAddress);

  const prevPendingApprovals = usePrevious(pendingApprovals);

  useEffect(() => {
    console.log('use effect 2!');
    const removedFromPending =
      !get(pendingApprovals, `[${inputCurrencyAddress}]`, null) &&
      get(prevPendingApprovals, `[${inputCurrencyAddress}]`, null); // TODO JIN prev props

    // TODO JIN will this input currency prev input currency address check work?
    if (
      removedFromPending ||
      inputCurrencyAddress !== prevInputCurrencyAddress
    ) {
      getCurrencyAllowance();
    }
  }, [
    getCurrencyAllowance,
    inputCurrencyAddress,
    pendingApprovals,
    prevInputCurrencyAddress,
    prevPendingApprovals,
  ]);

  useEffect(() => {
    console.log('use effect 3!');
    if (!isTransitioning) {
      navigation.emit('refocus');
    }
  }, [isTransitioning, navigation]);

  useEffect(() => {
    console.log('use effect 4!');

    const isNewAmountOrCurrency =
      inputAmount !== prevInputAmount ||
      outputAmount !== prevOutputAmount ||
      inputCurrencyUniqueId !== prevInputCurrencyUniqueId ||
      outputCurrencyUniqueId !== prevOutputCurrencyUniqueId;

    let isNewNativeAmount = nativeAmount !== prevNativeAmount;

    const isNewCurrencyReserve =
      inputReserveTokenAddress !== prevInputReserveTokenAddress ||
      outputReserveTokenAddress !== prevOutputReserveTokenAddress;

    if (isNewNativeAmount) {
      // Only consider 'new' if the native input isnt focused,
      // otherwise itll fight with the user's keystrokes
      isNewNativeAmount = nativeFieldRef.current.isFocused();
    }

    if (isNewAmountOrCurrency || isNewNativeAmount || isNewCurrencyReserve) {
      getMarketDetails();
    }
  }, [
    getMarketDetails,
    inputAmount,
    inputCurrencyUniqueId,
    inputReserveTokenAddress,
    isTransitioning,
    nativeAmount,
    navigation,
    outputAmount,
    outputCurrencyUniqueId,
    outputReserveTokenAddress,
    prevInputAmount,
    prevInputCurrencyUniqueId,
    prevInputReserveTokenAddress,
    prevIsTransitioning,
    prevNativeAmount,
    prevOutputAmount,
    prevOutputCurrencyUniqueId,
    prevOutputReserveTokenAddress,
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
    if (inputFieldRef) inputFieldRef.current.clear();
    if (nativeFieldRef) nativeFieldRef.current.clear();
    if (outputFieldRef) outputFieldRef.current.clear();
  };

  const findNextFocused = () => {
    const inputRefTag = getNativeTag(inputFieldRef.current);
    const nativeInputRefTag = getNativeTag(nativeFieldRef.current);
    const outputRefTag = getNativeTag(outputFieldRef.current);

    // TODO JIN null checks?
    const lastFocusedIsInputType =
      lastFocusedInput.current === inputRefTag ||
      lastFocusedInput.current === nativeInputRefTag;

    const lastFocusedIsOutputType = lastFocusedInput.current === outputRefTag;

    if (lastFocusedIsInputType && !inputCurrency) {
      return outputRefTag;
    }

    if (lastFocusedIsOutputType && !outputCurrency) {
      return inputRefTag;
    }

    return lastFocusedInput.current;
  };

  const focusInputField = () => {
    if (inputFieldRef && inputFieldRef.current) {
      inputFieldRef.current.focus();
    }
  };

  const getCurrencyAllowance = useCallback(async () => {
    if (isNil(inputCurrency)) {
      return setIsAssetApproved(true);
    }

    const { address: inputAddress, exchangeAddress } = inputCurrency;

    if (inputAddress === 'eth') {
      return setIsAssetApproved(true);
    }

    let allowance = allowances[inputAddress];
    if (!greaterThan(allowance, 0)) {
      allowance = await contractUtils.getAllowance(
        accountAddress,
        inputCurrency,
        exchangeAddress
      );
      uniswapUpdateAllowances({ [toLower(inputAddress)]: allowance });
    }
    const isAssetApproved = greaterThan(allowance, 0);
    if (isAssetApproved) {
      setApprovalCreationTimestamp(null);
      setEstimatedApprovalTimeInMs(null);
      setIsAssetApproved(isAssetApproved);
      return setIsUnlockingAsset(false); // TODO JIN return?
    }
    const pendingApproval = pendingApprovals[toLower(inputCurrency.address)];
    const isUnlockingAsset = !!pendingApproval;

    try {
      const gasLimit = await contractUtils.estimateApprove(
        inputCurrency.address,
        exchangeAddress
      );
      gasUpdateTxFee(gasLimit, gasUtils.FAST);
      setApprovalCreationTimestamp(
        isUnlockingAsset ? pendingApproval.creationTimestamp : null
      );
      setEstimatedApprovalTimeInMs(
        isUnlockingAsset ? pendingApproval.estimatedTimeInMs : null
      );
      setIsAssetApproved(isAssetApproved);
      return setIsUnlockingAsset(isUnlockingAsset); // TODO JIN reeturn
    } catch (error) {
      gasUpdateTxFee();
      setApprovalCreationTimestamp(null);
      setEstimatedApprovalTimeInMs(null);
      setIsAssetApproved(isAssetApproved);
      return setIsUnlockingAsset(false); // TODO JIN return
    }
  }, [
    accountAddress,
    allowances,
    gasUpdateTxFee,
    inputCurrency,
    pendingApprovals,
    uniswapUpdateAllowances,
  ]);

  const updateTradeExecutionDetails = useCallback(() => {
    const _inputAmount = inputAmount;
    const _inputAsExactAmount = inputAsExactAmount;

    const { address: inputAddress, decimals: inputDecimals } = inputCurrency;
    const { address: outputAddress, decimals: outputDecimals } = outputCurrency;

    const isInputEth = inputAddress === 'eth';
    const isOutputEth = outputAddress === 'eth';

    let inputAmount = _inputAmount;
    let inputAsExactAmount = _inputAsExactAmount;
    const isMissingAmounts = !inputAmount && !outputAmount;

    if (isMissingAmounts) {
      const DEFAULT_NATIVE_INPUT_AMOUNT = 50;
      const inputNativePrice = getMarketPrice();
      inputAmount = convertAmountFromNativeValue(
        DEFAULT_NATIVE_INPUT_AMOUNT,
        inputNativePrice,
        inputCurrency.decimals
      );
      inputAsExactAmount = true;
    }

    const rawInputAmount = convertAmountToRawAmount(
      parseFloat(inputAmount) || 0,
      inputDecimals
    );

    const rawOutputAmount = convertAmountToRawAmount(
      parseFloat(outputAmount) || 0,
      outputDecimals
    );

    let tradeDetails = null;

    if (isInputEth && !isOutputEth) {
      tradeDetails = inputAsExactAmount
        ? tradeExactEthForTokensWithData(outputReserve, rawInputAmount, chainId)
        : tradeEthForExactTokensWithData(
            outputReserve,
            rawOutputAmount,
            chainId
          );
    } else if (!isInputEth && isOutputEth) {
      tradeDetails = inputAsExactAmount
        ? tradeExactTokensForEthWithData(inputReserve, rawInputAmount, chainId)
        : tradeTokensForExactEthWithData(
            inputReserve,
            rawOutputAmount,
            chainId
          );
    } else if (!isInputEth && !isOutputEth) {
      tradeDetails = inputAsExactAmount
        ? tradeExactTokensForTokensWithData(
            inputReserve,
            outputReserve,
            rawInputAmount,
            chainId
          )
        : tradeTokensForExactTokensWithData(
            inputReserve,
            outputReserve,
            rawOutputAmount,
            chainId
          );
    }

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

    setInputExecutionRate(inputExecutionRate);
    setInputNativePrice(inputNativePrice);
    setOutputExecutionRate(outputExecutionRate);
    setOutputNativePrice(outputNativePrice);
    setTradeDetails(tradeDetails);

    return tradeDetails;
  }, [
    chainId,
    getMarketPrice,
    inputCurrency,
    inputReserve,
    nativeCurrency,
    outputAmount,
    outputCurrency,
    outputReserve,
  ]);

  // TODO JIN make sure i'm not overriding variable names
  const getMarketDetails = useCallback(async () => {
    const isMissingCurrency = !inputCurrency || !outputCurrency;
    const isMissingReserves =
      (inputCurrency && inputCurrency.address !== 'eth' && !inputReserve) ||
      (outputCurrency && outputCurrency.address !== 'eth' && !outputReserve);
    if (isMissingCurrency || isMissingReserves) return;

    try {
      const tradeDetails = updateTradeExecutionDetails();

      const isMissingAmounts = !inputAmount && !outputAmount;
      if (isMissingAmounts) return;

      const { decimals: inputDecimals } = inputCurrency;
      const { decimals: outputDecimals } = outputCurrency;

      let inputExecutionRate = '';
      let outputExecutionRate = '';
      let inputNativePrice = '';
      let outputNativePrice = '';

      if (inputCurrency) {
        const inputPriceValue = get(inputCurrency, 'price.value', 0);
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
        const outputPriceValue = get(outputCurrency, 'price.value', 0);
        outputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rateInverted', BigNumber(0)),
          outputPriceValue,
          true
        );

        outputNativePrice = convertAmountToNativeDisplay(
          outputPriceValue,
          nativeCurrency
        );
      }

      const slippage = convertNumberToString(
        get(tradeDetails, 'executionRateSlippage', 0)
      );
      const inputBalance = ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        inputCurrency
      );

      const isSufficientBalance =
        !inputAmount || greaterThanOrEqualTo(inputBalance, inputAmount);

      // TODO JIN the updated values
      setInputExecutionRate(inputExecutionRate);
      setInputNativePrice(inputNativePrice);
      setIsSufficientBalance(isSufficientBalance);
      setOutputExecutionRate(outputExecutionRate);
      setOutputNativePrice(outputNativePrice);
      setSlippage(slippage);

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

      // TODO JIN current null check
      if (inputAsExactAmount) {
        if (
          (isInputEmpty || isInputZero) &&
          !outputFieldRef.current.isFocused()
        ) {
          updateOutputAmount();
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
      }

      // TODO JIN current null check
      if (!inputAsExactAmount && !inputFieldRef.current.isFocused()) {
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
      }

      if (isAssetApproved) {
        const gasLimit = await estimateSwapGasLimit(
          accountAddress,
          tradeDetails
        );
        gasUpdateTxFee(gasLimit);
      }
    } catch (error) {
      console.log('error getting market details', error);
      // TODO error state
    }
  }, [
    accountAddress,
    gasUpdateTxFee,
    getMarketPrice,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    inputReserve,
    isAssetApproved,
    nativeAmount,
    nativeCurrency,
    outputAmount,
    outputCurrency,
    outputReserve,
    selectedGasPrice,
    updateInputAmount,
    updateTradeExecutionDetails,
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

  const handleFocusField = ({ currentTarget }) => {
    lastFocusedInput.current = currentTarget;
  };

  const handlePressMaxBalance = () => {
    let maxBalance = get(inputCurrency, 'balance.amount', 0);
    if (inputCurrency.address === 'eth') {
      maxBalance = subtract(maxBalance, 0.01);
    }

    return updateInputAmount(maxBalance);
  };

  const handleSubmit = async () => {
    setIsAuthorizing(true);
    try {
      const gasPrice = get(selectedGasPrice, 'value.amount');
      const txn = await executeSwap(tradeDetails, gasLimit, gasPrice);
      setIsAuthorizing(false);
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
    } catch (error) {
      setIsAuthorizing(false);
      console.log('error submitting swap', error);
      navigation.setParams({ focused: false });
      navigation.navigate('WalletScreen');
    }
  };

  const handleUnlockAsset = async () => {
    try {
      const fastGasPrice = get(gasPrices, `[${gasUtils.FAST}]`);
      const {
        creationTimestamp: approvalCreationTimestamp,
        approval: { hash },
      } = await contractUtils.approve(
        inputCurrency.address,
        inputCurrency.exchangeAddress,
        gasLimit,
        get(fastGasPrice, 'value.amount')
      );
      const estimatedApprovalTimeInMs =
        parseInt(get(fastGasPrice, 'estimatedTime.amount')) ||
        DEFAULT_APPROVAL_ESTIMATION_TIME_IN_MS;
      uniswapAddPendingApproval(
        inputCurrency.address,
        hash,
        approvalCreationTimestamp,
        estimatedApprovalTimeInMs
      );
      setApprovalCreationTimestamp(approvalCreationTimestamp);
      setEstimatedApprovalTimeInMs(estimatedApprovalTimeInMs);
      setIsUnlockingAsset(true);
    } catch (error) {
      console.log('could not unlock asset', error);
      setApprovalCreationTimestamp(null);
      setEstimatedApprovalTimeInMs(null);
      setIsUnlockingAsset(false);
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
      inputCurrencySymbol: get(inputCurrency, 'symbol'),
      inputExecutionRate,
      inputNativePrice,
      onRefocusInput: handleRefocusLastInput,
      outputCurrencySymbol: get(outputCurrency, 'symbol'),
      outputExecutionRate,
      outputNativePrice,
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
    (inputAmount, amountDisplay, inputAsExactAmount = true) => {
      setInputAmount(inputAmount);
      setInputAsExactAmount(inputAsExactAmount);
      setInputAmountDisplay(
        amountDisplay !== undefined ? amountDisplay : inputAmount
      );

      if (!nativeFieldRef.current.isFocused()) {
        let nativeAmount = null;

        const isInputZero = isZero(inputAmount);

        if (inputAmount && !isInputZero) {
          let nativePrice = get(inputCurrency, 'native.price.amount', null);
          if (isNil(nativePrice)) {
            nativePrice = getMarketPrice();
          }
          nativeAmount = convertAmountToNativeAmount(inputAmount, nativePrice);
        }
        setNativeAmount(nativeAmount);
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
    let inputAmount = null;
    let inputAmountDisplay = null;

    const isNativeZero = isZero(nativeAmount);

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
    setNativeAmount(nativeAmount);
    setInputAsExactAmount(true);
  };

  const updateOutputAmount = (
    outputAmount,
    amountDisplay,
    inputAsExactAmount = false
  ) => {
    console.log('1 update output amount', outputAmount);
    setInputAsExactAmount(inputAsExactAmount);
    console.log('2', inputAsExactAmount);
    setOutputAmount(outputAmount);
    console.log('3');
    setOutputAmountDisplay(
      amountDisplay !== undefined ? amountDisplay : outputAmount
    );
    console.log('4 output amount display', amountDisplay);
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

  const showDetailsButton =
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
          <FloatingPanel radius={exchangeModalBorderRadius} overflow="visible">
            <GestureBlocker type="top" />
            <ExchangeModalHeader
              onPressDetails={navigateToSwapDetailsModal}
              showDetailsButton={showDetailsButton}
            />
            <ExchangeInputField
              inputAmount={inputAmountDisplay}
              inputCurrencyAddress={get(inputCurrency, 'address', null)}
              inputCurrencySymbol={get(inputCurrency, 'symbol', null)}
              inputFieldRef={assignInputFieldRef}
              isAssetApproved={isAssetApproved}
              isUnlockingAsset={isUnlockingAsset}
              nativeAmount={nativeAmount}
              nativeCurrency={nativeCurrency}
              nativeFieldRef={assignNativeFieldRef}
              onFocus={handleFocusField}
              onPressMaxBalance={handlePressMaxBalance}
              onPressSelectInputCurrency={navigateToSelectInputCurrency}
              onUnlockAsset={handleUnlockAsset}
              setInputAmount={updateInputAmount}
              setNativeAmount={updateNativeAmount}
            />
            {showOutputField && (
              <ExchangeOutputField
                bottomRadius={exchangeModalBorderRadius}
                onFocus={handleFocusField}
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
          {(showConfirmButton || !isAssetApproved) && (
            <Fragment>
              <Centered css={padding(24, 15, 0)} flexShrink={0} width="100%">
                <ConfirmExchangeButton
                  creationTimestamp={approvalCreationTimestamp}
                  disabled={isAssetApproved && !Number(inputAmountDisplay)}
                  estimatedApprovalTimeInMs={estimatedApprovalTimeInMs}
                  inputCurrencyName={get(inputCurrency, 'symbol')}
                  isAssetApproved={isAssetApproved}
                  isAuthorizing={isAuthorizing}
                  isSufficientBalance={isSufficientBalance}
                  isUnlockingAsset={isUnlockingAsset}
                  onSubmit={handleSubmit}
                  onUnlockAsset={handleUnlockAsset}
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
  accountAddress: PropTypes.string,
  allAssets: PropTypes.array,
  allowances: PropTypes.object,
  chainId: PropTypes.number,
  dataAddNewTransaction: PropTypes.func,
  defaultInputAddress: PropTypes.string,
  gasLimit: PropTypes.number,
  gasPricesStartPolling: PropTypes.func,
  gasPricesStopPolling: PropTypes.func,
  gasUpdateDefaultGasLimit: PropTypes.func,
  gasUpdateTxFee: PropTypes.func,
  inputHeaderTitle: PropTypes.string,
  inputReserve: PropTypes.object,
  nativeCurrency: PropTypes.string,
  navigation: PropTypes.object,
  outputReserve: PropTypes.object,
  pendingApprovals: PropTypes.object,
  selectedGasPrice: PropTypes.object,
  tabPosition: PropTypes.object, // animated value
  tradeDetails: PropTypes.object,
  uniswapAddPendingApproval: PropTypes.func,
  uniswapAssetsInWallet: PropTypes.arrayOf(PropTypes.object),
  uniswapUpdateAllowances: PropTypes.func,
  uniswapUpdateInputCurrency: PropTypes.func,
  uniswapUpdateOutputCurrency: PropTypes.func,
  web3ListenerInit: PropTypes.func,
  web3ListenerStop: PropTypes.func,
};

export default ExchangeModal;
