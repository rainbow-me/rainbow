import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import ShadowStack from 'react-native-shadow-stack';
import { withNeverRerender } from '../../hoc';
import { colors, fonts, padding } from '../../styles';
import { TokenSelectionButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { EnDash } from '../html-entities';
import { Row, RowWithMargins } from '../layout';
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

const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);

const ExchangeOutputField = ({
  assignOutputFieldRef,
  bottomRadius,
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
    <Row
      align="center"
      flex={0}
      width="100%"
      css={`
        ${padding(24 + paddingValue, 0, 26)};
        background-color: ${colors.white};
        overflow: hidden;
        border-bottom-left-radius: ${bottomRadius}px;
        border-bottom-right-radius: ${bottomRadius}px;
      `}
    >
      <FakeNotchThing />
      <RowWithMargins
        align="center"
        flex={1}
        margin={10}
        onPress={handleFocusInput}
        paddingLeft={paddingValue}
      >
        <CoinIcon
          bgColor={outputCurrencySymbol ? undefined : skeletonColor}
          flex={0}
          size={40}
          address={outputCurrencyAddress}
          symbol={outputCurrencySymbol}
        />
        <ExchangeInput
          disableTabularNums
          editable={!!outputCurrencySymbol}
          fontFamily={fonts.family.SFProRounded}
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
  bottomRadius: PropTypes.number,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onPressSelectOutputCurrency: PropTypes.func,
  outputAmount: PropTypes.string,
  outputCurrencyAddress: PropTypes.string,
  outputCurrencySymbol: PropTypes.string,
  setOutputAmount: PropTypes.func,
};

export default ExchangeOutputField;
