import {
  tradeEthForExactTokensWithData,
  tradeExactEthForTokensWithData,
  tradeExactTokensForEthWithData,
  tradeExactTokensForTokensWithData,
  tradeTokensForExactEthWithData,
  tradeTokensForExactTokensWithData,
} from '@uniswap/sdk';
import { get, isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { InteractionManager, LayoutAnimation, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import {
  compose,
  mapProps,
  toClass,
  withProps,
} from 'recompact';
import { executeSwap } from '../handlers/uniswap';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToRawAmount,
  convertRawAmountToDecimalFormat,
  greaterThan,
  subtract,
} from '../helpers/utilities';
import {
  withAccountAddress,
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withKeyboardFocusHistory,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withUniswapAssets,
} from '../hoc';
import { colors, padding, position } from '../styles';
import { contractUtils, ethereumUtils, isNewValueForPath } from '../utils';
import {
  ConfirmExchangeButton,
  ExchangeGasFeeButton,
  ExchangeInputField,
  ExchangeModalHeader,
  ExchangeOutputField,
  SlippageWarning,
} from '../components/exchange';
import { FloatingPanel, FloatingPanels } from '../components/expanded-state';
import GestureBlocker from '../components/GestureBlocker';
import {
  Centered,
  Column,
  KeyboardFixedOpenLayout,
} from '../components/layout';
import { CurrencySelectionTypes } from './CurrencySelectModal';

export const exchangeModalBorderRadius = 30;

const AnimatedFloatingPanels = Animated.createAnimatedComponent(toClass(FloatingPanels));

const isSameAsset = (firstAsset, secondAsset) => {
  if (!firstAsset || !secondAsset) {
    return false;
  }

  const firstAddress = get(firstAsset, 'address', '').toLowerCase();
  const secondAddress = get(secondAsset, 'address', '').toLowerCase();
  return firstAddress === secondAddress;
};

class ExchangeModal extends PureComponent {
  static propTypes = {
    accountAddress: PropTypes.string,
    allAssets: PropTypes.array,
    allowances: PropTypes.object,
    chainId: PropTypes.number,
    clearKeyboardFocusHistory: PropTypes.func,
    dataAddNewTransaction: PropTypes.func,
    isFocused: PropTypes.bool,
    isTransitioning: PropTypes.bool,
    keyboardFocusHistory: PropTypes.array,
    nativeCurrency: PropTypes.string,
    navigation: PropTypes.object,
    pushKeyboardFocusHistory: PropTypes.func,
    tokenReserves: PropTypes.array,
    tradeDetails: PropTypes.object,
    transitionPosition: PropTypes.object, // animated value
    uniswapGetTokenReserve: PropTypes.func,
    uniswapUpdateAllowances: PropTypes.func,
  }

  state = {
    inputAllowance: null,
    inputAmount: null,
    inputAsExactAmount: false,
    inputCurrency: ethereumUtils.getAsset(this.props.allAssets),
    isAssetApproved: true,
    nativeAmount: null,
    outputAmount: null,
    outputCurrency: null,
    showConfirmButton: false,
    slippage: null,
    tradeDetails: null,
  }

  componentDidUpdate = (prevProps, prevState) => {
    const {
      isFocused,
      isTransitioning,
      keyboardFocusHistory,
    } = this.props;

    if (isFocused && (!isTransitioning && prevProps.isTransitioning)) {
      const lastFocusedInput = keyboardFocusHistory[keyboardFocusHistory.length - 2];

      if (lastFocusedInput) {
        InteractionManager.runAfterInteractions(() => {
          TextInput.State.focusTextInput(lastFocusedInput);
        });
      } else {
        // console.log('ELSE')
        // this.inputFieldRef.focus();
      }
    }

    if (this.state.outputCurrency) {
      this.setState({ showConfirmButton: true });
    }

    const isNewNativeAmount = isNewValueForPath(this.state, prevState, 'nativeAmount');
    const isNewInputAmount = isNewValueForPath(this.state, prevState, 'inputAmount');
    const isNewOutputAmount = isNewValueForPath(this.state, prevState, 'outputAmount');

    if (isNewNativeAmount || isNewInputAmount || isNewOutputAmount) {
      this.getMarketDetails();
      LayoutAnimation.easeInEaseOut();
    }

    if (isNewValueForPath(this.state, prevState, 'inputCurrency.address')) {
      this.getCurrencyAllowance();
    }
  }

  componentWillUnmount = () => {
    this.props.clearKeyboardFocusHistory();
  }

  /* eslint-disable lines-between-class-members */
  inputFieldRef = null
  nativeFieldRef = null
  outputFieldRef = null

  assignInputFieldRef = (ref) => { this.inputFieldRef = ref; }
  assignNativeFieldRef = (ref) => { this.nativeFieldRef = ref; }
  assignOutputFieldRef = (ref) => { this.outputFieldRef = ref; }
  /* eslint-enable lines-between-class-members */

  getCurrencyAllowance = async () => {
    const { accountAddress, allowances, uniswapUpdateAllowances } = this.props;
    const { inputCurrency } = this.state;
    const { address: inputAddress, exchangeAddress } = inputCurrency;

    if (inputAddress === 'eth') {
      return this.setState({ isAssetApproved: true });
    }

    let allowance = allowances[inputAddress];
    if (!allowance) {
      allowance = await contractUtils.getAllowance(accountAddress, inputCurrency, exchangeAddress);
      uniswapUpdateAllowances(inputAddress, allowance);
    }

    return this.setState({ isAssetApproved: greaterThan(allowance, 0) });
  }

  getReserveData = async (tokenAddress) => {
    const { tokenReserves, uniswapGetTokenReserve } = this.props;

    if (tokenAddress === 'eth') {
      return null;
    }

    let reserve = tokenReserves[tokenAddress.toLowerCase()];
    if (!reserve) {
      reserve = await uniswapGetTokenReserve(tokenAddress);
    }

    return reserve;
  }

  getMarketDetails = async () => {
    const { chainId } = this.props;
    const {
      inputAmount,
      inputAsExactAmount,
      inputCurrency,
      nativeAmount,
      outputAmount,
      outputCurrency,
    } = this.state;

    const isMissingAmounts = !inputAmount && !outputAmount;
    const isMissingCurrency = !inputCurrency || !outputCurrency;
    if (isMissingAmounts || isMissingCurrency) {
      return;
    }

    try {
      const { address: inputAddress, decimals: inputDecimals } = inputCurrency;
      const { address: outputAddress, decimals: outputDecimals } = outputCurrency;

      const isInputEth = inputAddress === 'eth';
      const isOutputEth = outputAddress === 'eth';

      const inputReserve = await this.getReserveData(inputAddress);
      const outputReserve = await this.getReserveData(outputAddress);

      const rawInputAmount = convertAmountToRawAmount(inputAmount || 0, inputDecimals);
      const rawOutputAmount = convertAmountToRawAmount(outputAmount || 0, outputDecimals);

      let tradeDetails = null;

      if (isInputEth && !isOutputEth) {
        tradeDetails = inputAsExactAmount
          ? tradeExactEthForTokensWithData(outputReserve, rawInputAmount, chainId)
          : tradeEthForExactTokensWithData(outputReserve, rawOutputAmount, chainId);
      } else if (!isInputEth && isOutputEth) {
        tradeDetails = inputAsExactAmount
          ? tradeExactTokensForEthWithData(inputReserve, rawInputAmount, chainId)
          : tradeTokensForExactEthWithData(inputReserve, rawOutputAmount, chainId);
      } else if (!isInputEth && !isOutputEth) {
        tradeDetails = inputAsExactAmount
          ? tradeExactTokensForTokensWithData(inputReserve, outputReserve, rawInputAmount, chainId)
          : tradeTokensForExactTokensWithData(inputReserve, outputReserve, rawOutputAmount, chainId);
      }

      const updatedAmountKey = inputAsExactAmount ? 'outputAmount' : 'inputAmount';
      const amountToUpdate = get(tradeDetails, `${updatedAmountKey}.amount`);
      const decimals = inputAsExactAmount ? outputDecimals : inputDecimals;

      this.setState({
        slippage: get(tradeDetails, 'marketRateSlippage', 0).toFixed(),
        tradeDetails,
        [updatedAmountKey]: convertRawAmountToDecimalFormat(amountToUpdate, decimals),
      });
    } catch (error) {
      console.log('error getting market details', error);
      // TODO
    }
  }

  setInputAmount = (inputAmount) => {
    this.setState(({ inputCurrency }) => {
      const nativePrice = get(inputCurrency, 'native.price.amount', 0);

      let nativeAmount = null;
      if (inputAmount) {
        nativeAmount = convertAmountToNativeAmount(inputAmount, nativePrice);
      }

      return {
        inputAmount,
        inputAsExactAmount: true,
        nativeAmount,
      };
    });
  }

  setNativeAmount = (nativeAmount) => {
    this.setState(({ inputCurrency }) => {
      const nativePrice = get(inputCurrency, 'native.price.amount', 0);

      return {
        inputAmount: convertAmountFromNativeValue(nativeAmount, nativePrice),
        inputAsExactAmount: true,
        nativeAmount,
      };
    });
  }

  setOutputAmount = (outputAmount) => {
    this.setState({
      inputAsExactAmount: false,
      outputAmount,
    });
  }

  setInputCurrency = (inputCurrency, force) => {
    const { outputCurrency } = this.state;

    this.setState({ inputCurrency });

    if (!force && isSameAsset(inputCurrency, outputCurrency)) {
      if (!isNil(inputCurrency) && !isNil(outputCurrency)) {
        this.setOutputCurrency(null, true);
      } else {
        this.setOutputCurrency(inputCurrency, true);
      }
    }
  }

  setOutputCurrency = (outputCurrency, force) => {
    const { allAssets } = this.props;
    const { inputCurrency } = this.state;

    this.setState({ outputCurrency });

    if (!force && isSameAsset(inputCurrency, outputCurrency)) {
      const outputAddress = outputCurrency.address.toLowerCase();
      const asset = ethereumUtils.getAsset(allAssets, outputAddress);

      if (!isNil(asset) && !isNil(inputCurrency) && !isNil(outputCurrency)) {
        this.setInputCurrency(null, true);
      } else {
        this.setInputCurrency(outputCurrency, true);
      }
    }
  }

  onPressMaxBalance = () => {
    const { inputCurrency } = this.state;

    let maxBalance = get(inputCurrency, 'balance.amount', 0);
    if (inputCurrency.address === 'eth') {
      maxBalance = subtract(maxBalance, 0.01);
    }

    return this.setInputAmount(maxBalance);
  }

  handleSelectInputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      onSelectCurrency: this.setInputCurrency,
      type: CurrencySelectionTypes.input,
    });
  }

  handleSelectOutputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      onSelectCurrency: this.setOutputCurrency,
      type: CurrencySelectionTypes.output,
    });
  }

  handleSubmit = async () => {
    const { accountAddress, dataAddNewTransaction, navigation } = this.props;
    const { inputAmount, inputCurrency, tradeDetails } = this.state;

    try {
      const txn = await executeSwap(tradeDetails);
      if (txn) {
        dataAddNewTransaction({
          amount: inputAmount,
          asset: inputCurrency,
          from: accountAddress,
          hash: txn.hash,
          nonce: get(txn, 'nonce'),
          to: get(txn, 'to'),
        });
      }
      navigation.navigate('ProfileScreen');
    } catch (error) {
      console.log('error submitting swap', error);
      navigation.navigate('WalletScreen');
    }
  }

  handleWillFocus = ({ lastState }) => {
    if (!lastState && this.inputFieldRef) {
      this.inputFieldRef.focus();
    }
  }

  handleDidFocus = () => {
    // console.log('DID FOCUS', this.props.navigation)
  }

  handleFocusField = ({ currentTarget }) => {
    this.props.pushKeyboardFocusHistory(currentTarget);
  }

  render = () => {
    const { nativeCurrency, transitionPosition } = this.props;

    const {
      inputAmount,
      inputCurrency,
      isAssetApproved,
      nativeAmount,
      outputAmount,
      outputCurrency,
      showConfirmButton,
      slippage,
    } = this.state;

    return (
      <KeyboardFixedOpenLayout>
        <NavigationEvents
          onDidFocus={this.handleDidFocus}
          onWillFocus={this.handleWillFocus}
        />
        <Centered
          {...position.sizeAsObject('100%')}
          backgroundColor={colors.transparent}
          direction="column"
        >
          <AnimatedFloatingPanels
            margin={0}
            style={{
              opacity: Animated.interpolate(transitionPosition, {
                extrapolate: 'clamp',
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
          >
            <GestureBlocker type='top'/>
            <FloatingPanel radius={exchangeModalBorderRadius}>
              <ExchangeModalHeader />
              <Column align="center" flex={0}>
                <ExchangeInputField
                  inputAmount={inputAmount}
                  inputCurrency={get(inputCurrency, 'symbol', null)}
                  inputFieldRef={this.assignInputFieldRef}
                  isAssetApproved={isAssetApproved}
                  nativeAmount={nativeAmount}
                  nativeCurrency={nativeCurrency}
                  nativeFieldRef={this.assignNativeFieldRef}
                  onFocus={this.handleFocusField}
                  onPressMaxBalance={this.onPressMaxBalance}
                  onPressSelectInputCurrency={this.handleSelectInputCurrency}
                  setInputAmount={this.setInputAmount}
                  setNativeAmount={this.setNativeAmount}
                />
                <ExchangeOutputField
                  onFocus={this.handleFocusField}
                  onPressSelectOutputCurrency={this.handleSelectOutputCurrency}
                  outputAmount={outputAmount}
                  outputCurrency={get(outputCurrency, 'symbol', null)}
                  outputFieldRef={this.assignOutputFieldRef}
                  setOutputAmount={this.setOutputAmount}
                />
              </Column>
            </FloatingPanel>
            <SlippageWarning slippage={slippage} />
            {showConfirmButton && (
              <Fragment>
                <Centered
                  css={padding(19, 15, 0)}
                  flexShrink={0}
                  width="100%"
                >
                  <ConfirmExchangeButton
                    disabled={!Number(inputAmount)}
                    onPress={this.handleSubmit}
                  />
                </Centered>
                <ExchangeGasFeeButton
                  gasPrice={'$0.06'}
                />
              </Fragment>
            )}
            <GestureBlocker type='bottom'/>
          </AnimatedFloatingPanels>
        </Centered>
      </KeyboardFixedOpenLayout>
    );
  }
}

const withMockedPrices = withProps({
  currencyToDollar: 3,
  targetCurrencyToDollar: 2,
});

export default compose(
  withAccountAddress,
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withKeyboardFocusHistory,
  withMockedPrices,
  withNavigationFocus,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withUniswapAssets,
  mapProps(({
    navigation,
    stackTransitionProps: {
      isTransitioning: isStacksTransitioning,
    },
    tabsTransitionProps: {
      isTransitioning: isTabsTransitioning,
    },
    ...props
  }) => ({
    ...props,
    isTransitioning: isStacksTransitioning || isTabsTransitioning,
    navigation,
    transitionPosition: get(navigation, 'state.params.position'),
  })),
)(ExchangeModal);
