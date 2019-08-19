import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withNeverRerender } from '../../hoc';
import { colors, padding, position, shadow } from '../../styles';
import { CoolButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { EnDash } from '../html-entities';
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

export default class ExchangeOutputField extends PureComponent {
  static propTypes = {
    onPressSelectOutputCurrency: PropTypes.func,
    outputAmount: PropTypes.string,
    outputCurrency: PropTypes.string,
    outputFieldRef: PropTypes.func.isRequired,
    setOutputAmount: PropTypes.func,
  }

  outputFieldRef = null

  handleFocusInput = () => {
    if (this.outputFieldRef) {
      this.outputFieldRef.focus();
    }
  }

  handleOutputFieldRef = (ref) => {
    this.outputFieldRef = ref;
    this.props.outputFieldRef(ref);
  }

  render = () => {
    const {
      onFocus,
      onPressSelectOutputCurrency,
      outputAmount,
      outputCurrency,
      setOutputAmount,
    } = this.props;

    const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);

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
            size={40}
            symbol={outputCurrency}
          />
          <ExchangeInput
            editable={!!outputCurrency}
            onChangeText={setOutputAmount}
            onFocus={onFocus}
            placeholder={outputCurrency ? '0' : EnDash.unicode}
            placeholderTextColor={outputCurrency ? undefined : skeletonColor}
            refInput={this.props.outputFieldRef}
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
