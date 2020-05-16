import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { borders, colors, fonts } from '../../styles';
import { TokenSelectionButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { Row, RowWithMargins } from '../layout';
import { EnDash } from '../text';
import ExchangeInput from './ExchangeInput';

const paddingValue = 15;
const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);

const FakeNotchShadow = [
  [0, 0, 1, colors.dark, 0.01],
  [0, 4, 12, colors.dark, 0.04],
  [0, 8, 23, colors.dark, 0.05],
];

const Container = styled(Row).attrs({
  align: 'center',
})`
  ${borders.buildRadius('bottom', 30)};
  background-color: ${colors.white};
  flex: 0;
  overflow: hidden;
  padding-bottom: 26;
  padding-top: ${24 + paddingValue};
  width: 100%;
`;

const FakeNotchThing = styled(ShadowStack).attrs({
  shadows: FakeNotchShadow,
})`
  height: ${paddingValue};
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 0;
`;

const ExchangeOutputField = ({
  assignOutputFieldRef,
  onBlur,
  onFocus,
  onPressSelectOutputCurrency,
  outputAmount,
  outputCurrencyAddress,
  outputCurrencySymbol,
  setOutputAmount,
}) => {
  const outputFieldRef = useRef(null);

  const handleFocusInput = () => {
    if (outputFieldRef && outputFieldRef.current) {
      outputFieldRef.current.focus();
    }
  };

  const handleOutputFieldRef = ref => {
    outputFieldRef.current = ref;
    assignOutputFieldRef(ref);
  };

  return (
    <Container>
      <FakeNotchThing />
      <RowWithMargins
        align="center"
        flex={1}
        margin={10}
        onPress={handleFocusInput}
        paddingLeft={paddingValue}
      >
        <CoinIcon
          address={outputCurrencyAddress}
          bgColor={outputCurrencySymbol ? undefined : skeletonColor}
          flex={0}
          size={40}
          symbol={outputCurrencySymbol}
        />
        <ExchangeInput
          disableTabularNums
          editable={!!outputCurrencySymbol}
          height={40}
          letterSpacing={fonts.letterSpacing.roundedTightest}
          onBlur={onBlur}
          onChangeText={setOutputAmount}
          onFocus={onFocus}
          placeholder={outputCurrencySymbol ? '0' : EnDash.unicode}
          placeholderTextColor={
            outputCurrencySymbol ? undefined : skeletonColor
          }
          refInput={handleOutputFieldRef}
          value={outputAmount}
        />
      </RowWithMargins>
      <TokenSelectionButton
        onPress={onPressSelectOutputCurrency}
        symbol={outputCurrencySymbol}
      />
    </Container>
  );
};

ExchangeOutputField.propTypes = {
  assignOutputFieldRef: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onPressSelectOutputCurrency: PropTypes.func,
  outputAmount: PropTypes.string,
  outputCurrencyAddress: PropTypes.string,
  outputCurrencySymbol: PropTypes.string,
  setOutputAmount: PropTypes.func,
};

export default ExchangeOutputField;
