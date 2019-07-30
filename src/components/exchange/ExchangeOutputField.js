import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { TouchableWithoutFeedback } from 'react-native';
import { colors, padding, position, shadow } from '../../styles';
import { CoolButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { Input } from '../inputs';
import {
  Centered,
  ColumnWithMargins,
  Row,
  RowWithMargins,
} from '../layout';
import { Monospace, Text } from '../text';
import { EmDash } from '../html-entities';

import {
  withNeverRerender,
} from '../../hoc';
import { Icon } from '../icons';
import { ShadowStack } from '../shadow-stack';

const paddingValue = 15;

const FakeNotchThing = withNeverRerender(() => (
  <ShadowStack
    height={paddingValue}
    shadows={[
      [0, 0, 1, colors.dark, 0.01],
      [0, 4, 12, colors.dark, 0.04],
      [0, 8, 23, colors.dark, 0.05],
    ]}
    shouldRasterizeIOS
    style={{
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 0,
    }}
    width="100%"
  />
));

//  <ShadowStack>
        // <CoinRow
        //   amount={amountToExchange}
        //   changeAmount={setAmountToExchange}
        //   navigateToCurrencySelection={onPressSelectCurrency}
        //   bottomRowRender={() => null}
        //   topRowRender={() => null}
        //   symbol={selectedOutputCurrency}
        // />

class ExchangeOutputField extends React.Component {
  static propTypes = {
    amount: PropTypes.number,
    onPressSelectOutputCurrency: PropTypes.string,
    selectedOutputCurrency: PropTypes.string,
    setAmountToExchange: PropTypes.func,
  }

  inputRef = React.createRef()

  handleFocusInput = () => this.inputRef.current.focus()

  render = () => {
    const {
      amount,
      onPressSelectOutputCurrency,
      selectedOutputCurrency,
      setAmountToExchange,
    } = this.props;

    const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);
    const placeholderColor = colors.alpha(colors.blueGreyDark, 0.5);

    console.log('selectedOutputCurrency', selectedOutputCurrency);

    return (
      <Row
        align="center"
        flex={0}
        width="100%"
        css={`
          ${padding(25 + paddingValue, 0, 25)};
          background-color: ${colors.white};
          overflow: hidden;
        `}
      >
        <FakeNotchThing />
        <RowWithMargins
          align="center"
          flex={1}
          margin={11}
          onPress={this.handleFocusInput}
          paddingLeft={paddingValue}
        >
          <CoinIcon
            backgroundColor={skeletonColor}
            bgColor={skeletonColor}
            flex={0}
            size={31}
            symbol={selectedOutputCurrency}
          />
          <Input
            flex={1}
            mono
            backgroundColor={colors.transparent}
            keyboardAppearance="dark"
            keyboardType="decimal-pad"
            editable={!!selectedOutputCurrency}
            onChangeText={setAmountToExchange}
            value={amount}
            placeholder={selectedOutputCurrency ? '0' : EmDash.unicode}
            placeholderTextColor={selectedOutputCurrency ? placeholderColor : skeletonColor}
            ref={this.inputRef}
            selectionColor={colors.appleBlue}
            size="h2"
          />
        </RowWithMargins>
        <CoolButton
          color={selectedOutputCurrency ? colors.dark : colors.appleBlue}
          onPress={onPressSelectOutputCurrency}
        >
          {selectedOutputCurrency || 'Choose a Coin'}
        </CoolButton>
      </Row>
    );
  }
}

export default ExchangeOutputField;
