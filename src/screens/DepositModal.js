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
import React, { Fragment, useCallback, useRef, useState } from 'react';
import { TextInput, InteractionManager } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import Animated from 'react-native-reanimated';
import { withNavigationFocus, NavigationEvents } from 'react-navigation';
import { compose, toClass, withProps } from 'recompact';
import { interpolate } from '../components/animations';
import {
  ConfirmExchangeButton,
  ExchangeInputField,
  ExchangeModalHeader,
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
import { useAccountData } from '../hooks';
import {
  withTransactionConfirmationScreen,
  withGas,
  withTransitionProps,
} from '../hoc';
import { colors, padding, position } from '../styles';
import { CurrencySelectionTypes } from './CurrencySelectModal';
import { exchangeModalBorderRadius } from './ExchangeModal';

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

const getNativeTag = field => get(field, '_inputRef._nativeTag');

const DepositModal = ({ tabPosition }) => {
  const { navigate } = useNavigation();
  const [inputCurrency, setInputCurrency] = useState({ symbol: 'DAI' });

  const inputFieldRef = useRef();
  const nativeFieldRef = useRef();
  const {
    settings: { nativeCurrency },
    ...accountData
  } = useAccountData();

  const inputAmountDisplay = '';
  const nativeAmount = '';

  console.log('accountData', accountData);
  console.log('nativeCurrency', nativeCurrency);

  const navigateToSelectInputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() =>
      navigate('CurrencySelectScreen', {
        headerTitle: 'Deposit',
        onSelectCurrency: setInputCurrency,
        type: CurrencySelectionTypes.input,
      })
    );
  }, [navigate, setInputCurrency]);

  const setInputAmount = useCallback(() => {}, []);
  const setNativeAmount = useCallback(() => {}, []);

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
            style={{ paddingBottom: 26 }}
          >
            <GestureBlocker type="top" />
            <ExchangeModalHeader title="Deposit" />
            <ExchangeInputField
              inputAmount={inputAmountDisplay}
              inputCurrencySymbol={get(inputCurrency, 'symbol', null)}
              inputFieldRef={ref => {
                inputFieldRef.current = ref;
              }}
              nativeAmount={nativeAmount}
              nativeFieldRef={ref => {
                nativeFieldRef.current = ref;
              }}
              nativeCurrency={nativeCurrency}
              onPressMaxBalance={() => console.log('PRESSED MAX BALANCE')}
              onPressSelectInputCurrency={navigateToSelectInputCurrency}
              setInputAmount={setInputAmount}
              setNativeAmount={setNativeAmount}
            />
          </FloatingPanel>
          <Column>
            <GestureBlocker type="bottom" />
          </Column>
        </AnimatedFloatingPanels>
      </Centered>
    </KeyboardFixedOpenLayout>
  );
}

export default compose(
  withGas,
  withNavigationFocus,
  withTransactionConfirmationScreen,
  withTransitionProps,
//   withUniswapAllowances,
//   withUniswapAssets,
  withProps(({ navigation, transitionProps: { isTransitioning } }) => ({
    isTransitioning,
    tabPosition: get(navigation, 'state.params.position'),
  }))
)(DepositModal);
