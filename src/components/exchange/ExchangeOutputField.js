import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import ShadowStack from 'react-native-shadow-stack';
import { withNeverRerender } from '../../hoc';
import { colors, fonts } from '../../styles';
import { TokenSelectionButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { EnDash } from '../html-entities';
import { Row, RowWithMargins } from '../layout';
import ExchangeInput from './ExchangeInput';

const paddingValue = 15;

const sx = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    paddingBottom: 26,
    paddingTop: 24 + paddingValue,
    width: '100%',
  },
  fakeNotch: {
    height: paddingValue,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    zIndex: 0,
  },
});

const FakeNotchShadow = [
  [0, 0, 1, colors.dark, 0.01],
  [0, 4, 12, colors.dark, 0.04],
  [0, 8, 23, colors.dark, 0.05],
];

const FakeNotchThing = withNeverRerender(() => (
  <ShadowStack shadows={FakeNotchShadow} style={sx.fakeNotch} />
));

const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);

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
    <Row align="center" flex={0} style={sx.container}>
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
    </Row>
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
