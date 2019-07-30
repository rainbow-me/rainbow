import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { TouchableWithoutFeedback } from 'react-native';
import { colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
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

import TextInputMask from 'react-native-text-input-mask';

export default class ExchangeInputField extends PureComponent {
  static propTypes = {
    amount: PropTypes.string,
    onPressMaxBalance: PropTypes.func,
    onPressSelectInputCurrency: PropTypes.string,
    selectedInputCurrency: PropTypes.string,
    setAmountToExchange: PropTypes.func,
  }

  inputRef = React.createRef()

  maskRef = null

  padding = 15

  handleFocusInput = () => {

    if (this.maskRef) {
      this.maskRef.focus();
    }
  }


  handleMaskRef = (ref) => {
    this.maskRef = ref;
  }

  render = () => {
    const {
      amount,
      onPressMaxBalance,
      onPressSelectInputCurrency,
      selectedInputCurrency,
      setAmountToExchange,
    } = this.props;
                // mask="[0...][-][9...]"

    return (
      <ColumnWithMargins flex={0} margin={14.5} width="100%">
        <Row align="center">
          <TouchableWithoutFeedback onPress={this.handleFocusInput}>
            <RowWithMargins
              align="center"
              flex={1}
              margin={11}
              paddingLeft={this.padding}
            >
              <CoinIcon
                size={31}
                symbol={selectedInputCurrency}
              />
              <Row align="center" flex={1}>
                <TextInputMask
                  autoFocus={true}
                  inputRef={this.handleMaskRef}
                  mask="[099999999999].[9999999999999]"
                  onChangeText={setAmountToExchange}
                  style={{
                    ...position.coverAsObject,
                    color: colors.white,
                    zIndex: 0,
                  }}
                />
                <Input
                  autoFocus={false}
                  flex={1}
                  keyboardAppearance="dark"
                  keyboardType="decimal-pad"
                  mono
                  placeholder="0"
                  placeholderTextColor={colors.alpha(colors.blueGreyDark, 0.5)}
                  ref={this.inputRef}
                  onChangeText={setAmountToExchange}
                  selectionColor={colors.appleBlue}
                  size="h2"
                  value={amount}
                />
               </Row>
            </RowWithMargins>
          </TouchableWithoutFeedback>
          <CoolButton
            color={selectedInputCurrency ? colors.dark : colors.appleBlue}
            onPress={onPressSelectInputCurrency}
          >
            {selectedInputCurrency || 'Choose a Coin'}
          </CoolButton>
        </Row>
        <Row align="center" justify="space-between" paddingLeft={this.padding}>
          <Centered paddingBottom={this.padding}>
            <Monospace
              size="large"
              color={colors.alpha(colors.blueGreyDark, 0.5)}
            >
              $0.00
            </Monospace>
          </Centered>
          <ButtonPressAnimation onPress={onPressMaxBalance}>
            <Centered paddingHorizontal={this.padding}>
              <Text
                color="appleBlue"
                size="medium"
                weight="semibold"
              >
                💰Max
              </Text>
            </Centered>
          </ButtonPressAnimation>
        </Row>
      </ColumnWithMargins>
    );
  }
}
