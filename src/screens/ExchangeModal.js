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
import React, { Component, Fragment } from 'react';
import { TextInput, InteractionManager } from 'react-native';
import Animated from 'react-native-reanimated';
import { compose, toClass, withProps } from 'recompact';
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
import {
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withBlockPolling,
  withGas,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withUniswapAssets,
} from '../hoc';
import ethUnits from '../references/ethereum-units.json';
import { colors, padding, position } from '../styles';
import {
  isNewValueForObjectPaths,
  contractUtils,
  ethereumUtils,
  gasUtils,
  isNewValueForPath,
} from '../utils';
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

const DEFAULT_APPROVAL_ESTIMATION_TIME_IN_MS = 30000; // 30 seconds
const DEFAULT_NATIVE_INPUT_AMOUNT = 50;

const getNativeTag = field => get(field, '_inputRef._nativeTag');

class ExchangeModal extends Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    allAssets: PropTypes.array,
    allowances: PropTypes.object,
    chainId: PropTypes.number,
    dataAddNewTransaction: PropTypes.func,
    gasLimit: PropTypes.number,
    gasPricesStartPolling: PropTypes.func,
    gasPricesStopPolling: PropTypes.func,
    gasUpdateDefaultGasLimit: PropTypes.func,
    gasUpdateTxFee: PropTypes.func,
    inputReserve: PropTypes.object,
    isFocused: PropTypes.bool,
    nativeCurrency: PropTypes.string,
    navigation: PropTypes.object,
    outputReserve: PropTypes.object,
    pendingApprovals: PropTypes.object,
    selectedGasPrice: PropTypes.object,
    tabPosition: PropTypes.object, // animated value
    tokenReserves: PropTypes.object,
    tradeDetails: PropTypes.object,
    txFees: PropTypes.object,
    uniswapAddPendingApproval: PropTypes.func,
    uniswapAssetsInWallet: PropTypes.arrayOf(PropTypes.object),
    uniswapUpdateAllowances: PropTypes.func,
    uniswapUpdateInputCurrency: PropTypes.func,
    uniswapUpdateOutputCurrency: PropTypes.func,
    web3ListenerInit: PropTypes.func,
    web3ListenerStop: PropTypes.func,
  };

  state = {
    approvalCreationTimestamp: null,
    estimatedApprovalTimeInMs: null,
    inputAllowance: null,
    inputAmount: null,
    inputAmountDisplay: null,
    inputAsExactAmount: true,
    inputCurrency: ethereumUtils.getAsset(this.props.allAssets),
    inputExecutionRate: null,
    inputNativePrice: null,
    isAssetApproved: true,
    isAuthorizing: false,
    isFocused: false,
    isSufficientBalance: true,
    isUnlockingAsset: false,
    nativeAmount: null,
    outputAmount: null,
    outputAmountDisplay: null,
    outputCurrency: null,
    outputExecutionRate: null,
    outputNativePrice: null,
    showConfirmButton: false,
    slippage: null,
    tradeDetails: null,
  };

  static getDerivedStateFromProps(props, state) {
    const isFocused = props.navigation.isFocused();
    return { ...state, isFocused };
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.props.navigation.setParams({ focused: true });
      this.props.gasUpdateDefaultGasLimit(ethUnits.basic_swap);
      this.props.gasPricesStartPolling();
      this.props.web3ListenerInit();
    });
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    const isFocused = this.state.isFocused;
    const willBeFocused = nextState.isFocused;

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
      (this.props.isTransitioning &&
        !nextProps.isTransitioning &&
        this.lastFocusedInput === null) ||
      (!isFocused && willBeFocused)
    ) {
      this.inputFocusInteractionHandle = InteractionManager.runAfterInteractions(
        this.focusInputField
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

  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.isTransitioning && !this.props.isTransitioning) {
      this.props.navigation.emit('refocus');
    }

    const isNewAmountOrCurrency = isNewValueForObjectPaths(
      this.state,
      prevState,
      [
        'inputAmount',
        'inputCurrency.uniqueId',
        'outputAmount',
        'outputCurrency.uniqueId',
      ]
    );

    let isNewNativeAmount = isNewValueForPath(
      this.state,
      prevState,
      'nativeAmount'
    );

    const isNewCurrencyReserve = isNewValueForObjectPaths(
      this.props,
      prevProps,
      ['inputReserve.token.address', 'outputReserve.token.address']
    );

    if (isNewNativeAmount) {
      // Only consider 'new' if the native input isnt focused,
      // otherwise itll fight with the user's keystrokes
      isNewNativeAmount = this.nativeFieldRef.isFocused();
    }

    if (isNewAmountOrCurrency || isNewNativeAmount || isNewCurrencyReserve) {
      this.getMarketDetails();
    }

    const inputCurrencyAddressPath = 'inputCurrency.address';
    const inputCurrencyAddress = toLower(
      get(this.state, inputCurrencyAddressPath)
    );

    const removedFromPending =
      !get(this.props, `pendingApprovals[${inputCurrencyAddress}]`, null) &&
      get(prevProps, `pendingApprovals[${inputCurrencyAddress}]`, null);

    if (
      removedFromPending ||
      isNewValueForPath(this.state, prevState, inputCurrencyAddressPath)
    ) {
      this.getCurrencyAllowance();
    }
  };

  componentWillUnmount = () => {
    if (this.inputFocusInteractionHandle) {
      InteractionManager.clearInteractionHandle(
        this.inputFocusInteractionHandle
      );
    }
    if (this.inputRefocusInteractionHandle) {
      InteractionManager.clearInteractionHandle(
        this.inputRefocusInteractionHandle
      );
    }
    InteractionManager.runAfterInteractions(() => {
      this.props.uniswapClearCurrenciesAndReserves();
      this.props.gasPricesStopPolling();
      this.props.web3ListenerStop();
    });
  };

  lastFocusedInput = null;
  inputFieldRef = null;
  nativeFieldRef = null;
  outputFieldRef = null;

  assignInputFieldRef = ref => {
    this.inputFieldRef = ref;
  };
  assignNativeFieldRef = ref => {
    this.nativeFieldRef = ref;
  };
  assignOutputFieldRef = ref => {
    this.outputFieldRef = ref;
  };

  clearForm = () => {
    if (this.inputFieldRef) this.inputFieldRef.clear();
    if (this.nativeFieldRef) this.nativeFieldRef.clear();
    if (this.outputFieldRef) this.outputFieldRef.clear();
  };

  findNextFocused = () => {
    const inputRefTag = getNativeTag(this.inputFieldRef);
    const nativeInputRefTag = getNativeTag(this.nativeFieldRef);
    const outputRefTag = getNativeTag(this.outputFieldRef);

    const lastFocusedIsInputType =
      this.lastFocusedInput === inputRefTag ||
      this.lastFocusedInput === nativeInputRefTag;

    const lastFocusedIsOutputType = this.lastFocusedInput === outputRefTag;

    if (lastFocusedIsInputType && !this.state.inputCurrency) {
      return outputRefTag;
    }

    if (lastFocusedIsOutputType && !this.state.outputCurrency) {
      return inputRefTag;
    }

    return this.lastFocusedInput;
  };

  focusInputField = () => {
    if (this.inputFieldRef) {
      this.inputFieldRef.focus();
    }
  };

  getCurrencyAllowance = async () => {
    const {
      accountAddress,
      allowances,
      gasUpdateTxFee,
      pendingApprovals,
      uniswapUpdateAllowances,
    } = this.props;
    const { inputCurrency } = this.state;

    if (isNil(inputCurrency)) {
      return this.setState({ isAssetApproved: true });
    }

    const { address: inputAddress, exchangeAddress } = inputCurrency;

    if (inputAddress === 'eth') {
      return this.setState({ isAssetApproved: true });
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
      return this.setState({
        approvalCreationTimestamp: null,
        estimatedApprovalTimeInMs: null,
        isAssetApproved,
        isUnlockingAsset: false,
      });
    }
    const pendingApproval = pendingApprovals[toLower(inputCurrency.address)];
    const isUnlockingAsset = !!pendingApproval;

    try {
      const gasLimit = await contractUtils.estimateApprove(
        inputCurrency.address,
        exchangeAddress
      );
      gasUpdateTxFee(gasLimit, gasUtils.FAST);
      return this.setState({
        approvalCreationTimestamp: isUnlockingAsset
          ? pendingApproval.creationTimestamp
          : null,
        estimatedApprovalTimeInMs: isUnlockingAsset
          ? pendingApproval.estimatedTimeInMs
          : null,
        isAssetApproved,
        isUnlockingAsset,
      });
    } catch (error) {
      gasUpdateTxFee();
      return this.setState({
        approvalCreationTimestamp: null,
        estimatedApprovalTimeInMs: null,
        isAssetApproved,
        isUnlockingAsset: false,
      });
    }
  };

  updateTradeExecutionDetails = () => {
    const { chainId, inputReserve, nativeCurrency, outputReserve } = this.props;
    const {
      inputAmount: _inputAmount,
      inputCurrency,
      inputAsExactAmount: _inputAsExactAmount,
      outputAmount,
      outputCurrency,
    } = this.state;

    const { address: inputAddress, decimals: inputDecimals } = inputCurrency;
    const { address: outputAddress, decimals: outputDecimals } = outputCurrency;

    const isInputEth = inputAddress === 'eth';
    const isOutputEth = outputAddress === 'eth';

    let inputAmount = _inputAmount;
    let inputAsExactAmount = _inputAsExactAmount;
    const isMissingAmounts = !inputAmount && !outputAmount;

    if (isMissingAmounts) {
      const inputNativePrice = this.getMarketPrice();
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
      const inputPriceValue = this.getMarketPrice();
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
      const outputPriceValue = this.getMarketPrice(false);
      outputExecutionRate = updatePrecisionToDisplay(
        get(tradeDetails, 'executionRate.rateInverted', BigNumber(0)),
        outputPriceValue
      );

      outputNativePrice = convertAmountToNativeDisplay(
        outputPriceValue,
        nativeCurrency
      );
    }

    this.setState({
      inputExecutionRate,
      inputNativePrice,
      outputExecutionRate,
      outputNativePrice,
      tradeDetails,
    });

    return tradeDetails;
  };

  getMarketDetails = async () => {
    const {
      accountAddress,
      gasUpdateTxFee,
      inputReserve,
      nativeCurrency,
      outputReserve,
      selectedGasPrice,
    } = this.props;
    const {
      inputAmount,
      inputAsExactAmount,
      inputCurrency,
      isAssetApproved,
      nativeAmount,
      outputAmount,
      outputCurrency,
    } = this.state;

    const isMissingCurrency = !inputCurrency || !outputCurrency;
    const isMissingReserves =
      (inputCurrency && inputCurrency.address !== 'eth' && !inputReserve) ||
      (outputCurrency && outputCurrency.address !== 'eth' && !outputReserve);
    if (isMissingCurrency || isMissingReserves) return;

    try {
      const tradeDetails = this.updateTradeExecutionDetails();

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

      this.setState({
        inputExecutionRate,
        inputNativePrice,
        isSufficientBalance,
        outputExecutionRate,
        outputNativePrice,
        slippage,
      });

      const isInputEmpty = !inputAmount;
      const isNativeEmpty = !nativeAmount;
      const isOutputEmpty = !outputAmount;

      const isInputZero = Number(inputAmount) === 0;
      const isOutputZero = Number(outputAmount) === 0;

      if (this.nativeFieldRef.isFocused() && isNativeEmpty) {
        this.clearForm();
      }

      if (inputAsExactAmount) {
        if ((isInputEmpty || isInputZero) && !this.outputFieldRef.isFocused()) {
          this.setOutputAmount();
        } else {
          const updatedOutputAmount = get(tradeDetails, 'outputAmount.amount');
          const rawUpdatedOutputAmount = convertRawAmountToDecimalFormat(
            updatedOutputAmount,
            outputDecimals
          );
          if (rawUpdatedOutputAmount !== '0') {
            let outputNativePrice = get(outputCurrency, 'price.value', null);
            if (isNil(outputNativePrice)) {
              outputNativePrice = this.getMarketPrice(false);
            }
            const updatedOutputAmountDisplay = updatePrecisionToDisplay(
              rawUpdatedOutputAmount,
              outputNativePrice
            );

            this.setOutputAmount(
              rawUpdatedOutputAmount,
              updatedOutputAmountDisplay,
              inputAsExactAmount
            );
          }
        }
      }

      if (!inputAsExactAmount && !this.inputFieldRef.isFocused()) {
        if (isOutputEmpty || isOutputZero) {
          this.setInputAmount();
          this.setState({
            isSufficientBalance: true,
          });
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

          this.setInputAmount(
            rawUpdatedInputAmount,
            updatedInputAmountDisplay,
            inputAsExactAmount
          );

          this.setState({
            isSufficientBalance: greaterThanOrEqualTo(
              inputBalance,
              rawUpdatedInputAmount
            ),
          });
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
  };

  getMarketPrice = (useInputReserve = true) => {
    const { allAssets, inputReserve, outputReserve } = this.props;
    const { inputCurrency, outputCurrency } = this.state;
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
  };

  handleFocusField = ({ currentTarget }) => {
    this.lastFocusedInput = currentTarget;
  };

  handlePressMaxBalance = () => {
    const { inputCurrency } = this.state;
    let maxBalance = get(inputCurrency, 'balance.amount', 0);
    if (inputCurrency.address === 'eth') {
      maxBalance = subtract(maxBalance, 0.01);
    }

    return this.setInputAmount(maxBalance);
  };

  handleSubmit = async () => {
    this.setState({ isAuthorizing: true });
    const {
      accountAddress,
      dataAddNewTransaction,
      gasLimit,
      navigation,
      selectedGasPrice,
    } = this.props;
    const { inputAmount, inputCurrency, tradeDetails } = this.state;

    try {
      const gasPrice = get(selectedGasPrice, 'value.amount');
      const txn = await executeSwap(tradeDetails, gasLimit, gasPrice);
      this.setState({ isAuthorizing: false });
      if (txn) {
        dataAddNewTransaction(
          {
            amount: inputAmount,
            asset: inputCurrency,
            from: accountAddress,
            hash: txn.hash,
            nonce: get(txn, 'nonce'),
            to: get(txn, 'to'),
          },
          true
        );
        navigation.setParams({ focused: false });
        navigation.navigate('ProfileScreen');
      }
    } catch (error) {
      this.setState({ isAuthorizing: false });
      console.log('error submitting swap', error);
      navigation.setParams({ focused: false });
      navigation.navigate('WalletScreen');
    }
  };

  handleUnlockAsset = async () => {
    try {
      const { inputCurrency } = this.state;
      const { gasLimit, gasPrices, uniswapAddPendingApproval } = this.props;
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
      this.setState({
        approvalCreationTimestamp,
        estimatedApprovalTimeInMs,
        isUnlockingAsset: true,
      });
    } catch (error) {
      console.log('could not unlock asset', error);
      this.setState({
        approvalCreationTimestamp: null,
        estimatedApprovalTimeInMs: null,
        isUnlockingAsset: false,
      });
    }
  };

  handleKeyboardManagement = () => {
    if (this.lastFocusedInput !== TextInput.State.currentlyFocusedField()) {
      TextInput.State.focusTextInput(this.findNextFocused());
      this.lastFocusedInput = null;
    }
  };

  handleRefocusLastInput = () => {
    this.inputRefocusInteractionHandle = InteractionManager.runAfterInteractions(
      () => {
        if (this.props.navigation.isFocused()) {
          TextInput.State.focusTextInput(this.findNextFocused());
        }
      }
    );
  };

  navigateToSwapDetailsModal = () => {
    const {
      inputCurrency,
      inputExecutionRate,
      inputNativePrice,
      outputCurrency,
      outputExecutionRate,
      outputNativePrice,
    } = this.state;

    this.inputFieldRef.blur();
    this.outputFieldRef.blur();
    this.nativeFieldRef.blur();
    this.props.navigation.setParams({ focused: false });
    this.props.navigation.navigate('SwapDetailsScreen', {
      inputCurrencySymbol: get(inputCurrency, 'symbol'),
      inputExecutionRate,
      inputNativePrice,
      onRefocusInput: this.handleRefocusLastInput,
      outputCurrencySymbol: get(outputCurrency, 'symbol'),
      outputExecutionRate,
      outputNativePrice,
      restoreFocusOnSwapModal: () => {
        this.props.navigation.setParams({ focused: true });
      },
      type: 'swap_details',
    });
  };

  navigateToSelectInputCurrency = () => {
    InteractionManager.runAfterInteractions(() => {
      this.props.navigation.setParams({ focused: false });
      this.props.navigation.navigate('CurrencySelectScreen', {
        onSelectCurrency: this.setInputCurrency,
        restoreFocusOnSwapModal: () => {
          this.props.navigation.setParams({ focused: true });
        },
        type: CurrencySelectionTypes.input,
      });
    });
  };

  navigateToSelectOutputCurrency = () => {
    InteractionManager.runAfterInteractions(() => {
      this.props.navigation.setParams({ focused: false });
      this.props.navigation.navigate('CurrencySelectScreen', {
        onSelectCurrency: this.setOutputCurrency,
        restoreFocusOnSwapModal: () => {
          this.props.navigation.setParams({ focused: true });
        },
        type: CurrencySelectionTypes.output,
      });
    });
  };

  setInputAmount = (inputAmount, amountDisplay, inputAsExactAmount = true) => {
    this.setState(({ inputCurrency }) => {
      const newState = {
        inputAmount,
        inputAmountDisplay:
          amountDisplay !== undefined ? amountDisplay : inputAmount,
        inputAsExactAmount,
      };

      if (!this.nativeFieldRef.isFocused()) {
        let nativeAmount = null;

        const isInputZero = isZero(inputAmount);

        if (inputAmount && !isInputZero) {
          let nativePrice = get(inputCurrency, 'native.price.amount', null);
          if (isNil(nativePrice)) {
            nativePrice = this.getMarketPrice();
          }
          nativeAmount = convertAmountToNativeAmount(inputAmount, nativePrice);
        }

        newState.nativeAmount = nativeAmount;
      }

      return newState;
    });
  };

  setInputCurrency = (inputCurrency, userSelected = true) => {
    const { inputCurrency: previousInputCurrency, outputCurrency } = this.state;

    if (!isSameAsset(inputCurrency, previousInputCurrency)) {
      this.clearForm();
    }

    this.setState({
      inputCurrency,
      showConfirmButton: !!inputCurrency && !!outputCurrency,
    });

    this.props.uniswapUpdateInputCurrency(inputCurrency);

    if (userSelected && isSameAsset(inputCurrency, outputCurrency)) {
      this.setOutputCurrency(previousInputCurrency, false);
    }
  };

  setNativeAmount = nativeAmount =>
    this.setState(({ inputCurrency }) => {
      let inputAmount = null;
      let inputAmountDisplay = null;

      const isNativeZero = isZero(nativeAmount);

      if (nativeAmount && !isNativeZero) {
        let nativePrice = get(inputCurrency, 'native.price.amount', null);
        if (isNil(nativePrice)) {
          nativePrice = this.getMarketPrice();
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

      return {
        inputAmount,
        inputAmountDisplay,
        inputAsExactAmount: true,
        nativeAmount,
      };
    });

  setOutputAmount = (outputAmount, amountDisplay, inputAsExactAmount = false) =>
    this.setState({
      inputAsExactAmount,
      outputAmount,
      outputAmountDisplay:
        amountDisplay !== undefined ? amountDisplay : outputAmount,
    });

  setOutputCurrency = (outputCurrency, userSelected = true) => {
    const {
      inputCurrency,
      outputCurrency: previousOutputCurrency,
    } = this.state;
    const { uniswapAssetsInWallet } = this.props;

    this.props.uniswapUpdateOutputCurrency(outputCurrency);

    this.setState({
      inputAsExactAmount: true,
      outputCurrency,
      showConfirmButton: !!inputCurrency && !!outputCurrency,
    });

    const existsInWallet = find(
      uniswapAssetsInWallet,
      asset => get(asset, 'address') === get(previousOutputCurrency, 'address')
    );
    if (userSelected && isSameAsset(inputCurrency, outputCurrency)) {
      if (existsInWallet) {
        this.setInputCurrency(previousOutputCurrency, false);
      } else {
        this.setInputCurrency(null, false);
      }
    }
  };

  render = () => {
    const { nativeCurrency, tabPosition } = this.props;

    const {
      approvalCreationTimestamp,
      estimatedApprovalTimeInMs,
      inputAmount,
      inputAmountDisplay,
      inputCurrency,
      inputExecutionRate,
      inputNativePrice,
      isAssetApproved,
      isAuthorizing,
      isSufficientBalance,
      isUnlockingAsset,
      nativeAmount,
      outputAmount,
      outputAmountDisplay,
      outputCurrency,
      outputExecutionRate,
      outputNativePrice,
      showConfirmButton,
      slippage,
    } = this.state;

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
            <FloatingPanel
              radius={exchangeModalBorderRadius}
              overflow="visible"
            >
              <ExchangeModalHeader
                onPressDetails={this.navigateToSwapDetailsModal}
                showDetailsButton={showDetailsButton}
              />
              <ExchangeInputField
                inputAmount={inputAmountDisplay}
                inputCurrencyAddress={get(inputCurrency, 'address', null)}
                inputCurrencySymbol={get(inputCurrency, 'symbol', null)}
                inputFieldRef={this.assignInputFieldRef}
                isAssetApproved={isAssetApproved}
                isUnlockingAsset={isUnlockingAsset}
                nativeAmount={nativeAmount}
                nativeCurrency={nativeCurrency}
                nativeFieldRef={this.assignNativeFieldRef}
                onFocus={this.handleFocusField}
                onPressMaxBalance={this.handlePressMaxBalance}
                onPressSelectInputCurrency={this.navigateToSelectInputCurrency}
                onUnlockAsset={this.handleUnlockAsset}
                setInputAmount={this.setInputAmount}
                setNativeAmount={this.setNativeAmount}
              />
              <ExchangeOutputField
                bottomRadius={exchangeModalBorderRadius}
                onFocus={this.handleFocusField}
                onPressSelectOutputCurrency={
                  this.navigateToSelectOutputCurrency
                }
                outputAmount={outputAmountDisplay}
                outputCurrencyAddress={get(outputCurrency, 'address', null)}
                outputCurrencySymbol={get(outputCurrency, 'symbol', null)}
                outputFieldRef={this.assignOutputFieldRef}
                setOutputAmount={this.setOutputAmount}
              />
            </FloatingPanel>
            {isSlippageWarningVisible && (
              <SlippageWarning slippage={slippage} />
            )}
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
                    onSubmit={this.handleSubmit}
                    onUnlockAsset={this.handleUnlockAsset}
                    slippage={slippage}
                  />
                </Centered>
                <GasSpeedButton />
              </Fragment>
            )}
          </AnimatedFloatingPanels>
        </Centered>
      </KeyboardFixedOpenLayout>
    );
  };
}

export default compose(
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withGas,
  withBlockPolling,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withUniswapAssets,
  withProps(({ navigation, transitionProps: { isTransitioning } }) => ({
    isTransitioning,
    tabPosition: get(navigation, 'state.params.position'),
  }))
)(ExchangeModal);
