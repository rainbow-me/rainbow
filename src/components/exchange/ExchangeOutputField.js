import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withNeverRerender } from '../../hoc';
import { colors, padding, position, shadow } from '../../styles';
import { CoolButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { EmDash } from '../html-entities';
import { Row, RowWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';
import ExchangeInput from './ExchangeInput';

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

class ExchangeOutputField extends PureComponent {
  static propTypes = {
    onPressSelectOutputCurrency: PropTypes.string,
    outputAmount: PropTypes.number,
    outputCurrency: PropTypes.string,
    setOutputAmount: PropTypes.func,
  }

  inputRef = React.createRef()

  handleFocusInput = () => this.inputRef.current.focus()

  render = () => {
    const {
      onPressSelectOutputCurrency,
      outputAmount,
      outputCurrency,
      setOutputAmount,
    } = this.props;

    const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);
    const placeholderColor = colors.alpha(colors.blueGreyDark, 0.5);

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
            bgColor={outputCurrency ? undefined : skeletonColor}
            flex={0}
            size={31}
            symbol={outputCurrency}
          />
          <ExchangeInput
            autoFocus={true}
            editable={!!outputCurrency}
            inputRef={this.inputRef}
            onChangeText={setOutputAmount}
            placeholder={outputCurrency ? '0' : EmDash.unicode}
            placeholderTextColor={outputCurrency ? placeholderColor : skeletonColor}
            value={outputAmount}
          />
        </RowWithMargins>
        <CoolButton
          color={outputCurrency ? colors.dark : colors.appleBlue}
          onPress={onPressSelectOutputCurrency}
        >
          {outputCurrency || 'Choose a Coin'}
        </CoolButton>
      </Row>
    );
  }
}

export default ExchangeOutputField;
