import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import {
  compose,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { NavigationEvents } from 'react-navigation';
import styled from 'styled-components/primitives';
import {
  Centered,
  Column,
  ColumnWithMargins,
} from '../components/layout';
import { withAccountData, withBlockedHorizontalSwipe } from '../hoc';
import { colors, padding, shadow } from '../styles';
import FloatingPanels from '../components/expanded-state/FloatingPanels';
import FloatingPanel from '../components/expanded-state/FloatingPanel';
import { Emoji, Text } from '../components/text';
import {
  ConfirmExchangeButton,
  ExchangeInputField,
  ExchangeOutputField,
} from '../components/exchange';
import GestureBlocker from '../components/GestureBlocker';
import { SheetHandle } from '../components/sheet';

const Container = styled(Centered).attrs({ direction: 'column' })`
  background-color: transparent;
  height: 100%;
`;

const FeeHolder = styled.View`
  ${padding(4, 10)}
  ${shadow.build(0, 6, 10, colors.dark, 0.14)}
  align-self: center;
  border-color: ${colors.alpha(colors.white, 0.45)};
  border-radius: 16;
  border-width: 1;
  height: 32;
  margin-top: 32;
`;

export const exchangeModalBorderRadius = 30;

const ExchangeRow = styled.View`
  width:  100%;
  padding-horizontal: 15;
`;

const ExchangeModal = (props) => {
  const {
    inputAmount,
    navigation,
    onNavigationToCurrencySelection,
    onPressConfirmExchange,
    onPressSelectInputCurrency,
    onPressSelectOutputCurrency,
    outputAmount,
    selectedInputCurrency,
    selectedOutputCurrency,
    setAmountToExchange,
    setInputAmount,
    setOutputAmount,
    showConfirmButton,
  } = props;

  console.log('navigation', navigation);

  return (
    <KeyboardAvoidingView behavior="padding">
      <NavigationEvents onWillFocus={onNavigationToCurrencySelection} />
      <Container>
        <FloatingPanels>
          <GestureBlocker type='top'/>
          <FloatingPanel radius={exchangeModalBorderRadius}>
            <ColumnWithMargins align="center" css={padding(9, 0)} margin={6}>
              <SheetHandle />
              <Text
                letterSpacing="tighter"
                lineHeight="loose"
                size="large"
                weight="bold"
              >
                Swap
              </Text>
            </ColumnWithMargins>
            <Column align="center">
              <ExchangeInputField
                amount={inputAmount}
                onPressSelectInputCurrency={onPressSelectInputCurrency}
                selectedInputCurrency={selectedInputCurrency}
                setAmountToExchange={setInputAmount}
              />
              <ExchangeOutputField
                amount={outputAmount}
                onPressSelectOutputCurrency={onPressSelectOutputCurrency}
                selectedOutputCurrency={selectedOutputCurrency}
                setAmountToExchange={setOutputAmount}
              />
                {/*<CoinRow
                  containerStyles={`
                    background-color: ${colors.lightestGrey};
                    height: 84;
                  `}
                  amount={inputAmount}
                  changeAmount={setAmountToExchange}
                  navigateToCurrencySelection={onPressSelectOutputCurrency}
                  bottomRowRender={() => null}
                  topRowRender={() => null}
                  symbol={selectedOutputCurrency}
                />
              */}
            </Column>
          </FloatingPanel>
          <GestureBlocker type='bottom'/>
          {showConfirmButton && (
            <Fragment>
              <ExchangeRow>
                <ConfirmExchangeButton
                  disabled={!Number(inputAmount)}
                  onPress={onPressConfirmExchange}
                />
              </ExchangeRow>
              {!!Number(inputAmount) && (
                <FeeHolder>
                  <Text
                    color={colors.alpha(colors.white, 0.45)}
                    lineHeight="loose"
                    size="smedium"
                  >
                    <Emoji name="fuelpump"/> Fee: $0.06
                  </Text>
                </FeeHolder>
              )}
            </Fragment>
          )}
        </FloatingPanels>
      </Container>
    </KeyboardAvoidingView>
  );
};

ExchangeModal.propTypes = {
  inputAmount: PropTypes.number,
  onPressConfirmExchange: PropTypes.func,
  onPressSelectInputCurrency: PropTypes.func,
  onPressSelectOutputCurrency: PropTypes.func,
  outputAmount: PropTypes.number,
  selectedInputCurrency: PropTypes.number,
  selectedOutputCurrency: PropTypes.number,
  setAmountToExchange: PropTypes.func,
  setSelectedInputCurrency: PropTypes.func,
  setSelectedOutputCurrency: PropTypes.func,
  showConfirmButton: PropTypes.bool,
};

const withMockedPrices = withProps({
  currencyToDollar: 3,
  targetCurrencyToDollar: 2,
});

export default compose(
  withAccountData,
  withState('inputAmount', 'setInputAmount', null),
  withState('outputAmount', 'setOutputAmount', null),
  withState('showConfirmButton', 'setShowConfirmButton', false),
  withState('selectedInputCurrency', 'setSelectedInputCurrency', 'ETH'),
  withState('selectedOutputCurrency', 'setSelectedOutputCurrency', null),
  withHandlers({
    onSelectInputCurrency: ({ setSelectedInputCurrency }) => value => setSelectedInputCurrency(value),
    onSelectOutputCurrency: ({ setSelectedOutputCurrency }) => value => setSelectedOutputCurrency(value),
  }),
  withHandlers({
    onNavigationToCurrencySelection: ({ selectedOutputCurrency, setShowConfirmButton }) => (lol) => {
      console.log('LOLOL', lol);

      if (selectedOutputCurrency) {
        setShowConfirmButton(true);
      }
    },
    onPressConfirmExchange: ({ navigation }) => () => {
      Keyboard.dismiss();
      navigation.navigate('WalletScreen');
    },
    onPressSelectInputCurrency: ({ navigation, onSelectInputCurrency }) => () => {
      navigation.navigate('CurrencySelectScreen', { onSelectCurrency: onSelectInputCurrency });
    },
    onPressSelectOutputCurrency: ({ navigation, onSelectOutputCurrency, setShowConfirmButton }) => () => {
      navigation.navigate('CurrencySelectScreen', { onSelectCurrency: onSelectOutputCurrency });
    },
  }),
  withBlockedHorizontalSwipe,
  withMockedPrices,
)(ExchangeModal);
