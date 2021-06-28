import analytics from '@segment/analytics-react-native';
import React, { useCallback, useRef } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { BubbleField } from '../fields';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
import { useDimensions } from '@rainbow-me/hooks';

const GradientBackground = styled(RadialGradient).attrs(
  ({ colorForAsset, theme: { colors }, width }) => {
    const FieldWidth = width - 38;

    return {
      center: [0, (FieldWidth - 38) / 2],
      colors: [
        colors.alpha(colorForAsset, 0),
        colors.alpha(colorForAsset, 0.06),
      ],
      stops: [0, 1],
    };
  }
)`
  height: ${({ width }) => width - 38};
  left: 0;
  position: absolute;
  transform: scaleY(0.175074184);
  top: ${({ width }) => -((width - 38 - 59) / 2)};
  width: ${({ width }) => width - 38};
`;

const Wrapper = styled(ButtonPressAnimation)`
  border-radius: 29.5;
  height: 59;
  overflow: hidden;
  padding-bottom: 11;
  padding-horizontal: 19;
  padding-top: 10;
  position: relative;
  width: 100%;
`;

export default function SendAssetFormField({
  autoFocus,
  colorForAsset,
  format,
  label,
  labelMaxLength = 6,
  mask,
  maxLabelColor,
  onChange,
  onFocus,
  onPressButton,
  placeholder,
  value,
  testID,
  ...props
}) {
  const { isTinyPhone, width } = useDimensions();
  const { colors } = useTheme();
  const handlePressButton = useCallback(
    event => {
      analytics.track('Clicked "Max" in Send flow input');
      onPressButton?.(event);
    },
    [onPressButton]
  );
  const bubbleField = useRef();

  return (
    <Wrapper onPress={() => bubbleField.current.focus()} scaleTo={1.05}>
      <GradientBackground colorForAsset={colorForAsset} width={width} />
      <RowWithMargins
        align="center"
        flex={1}
        justify="space-between"
        margin={12}
        {...props}
      >
        <BubbleField
          autoFocus={autoFocus}
          buttonText="Max"
          colorForAsset={colorForAsset || colors.dark}
          format={format}
          keyboardType="decimal-pad"
          mask={mask}
          maxLabelColor={maxLabelColor}
          onChange={onChange}
          onFocus={onFocus}
          onPressButton={handlePressButton}
          placeholder={placeholder}
          ref={bubbleField}
          testID={testID}
          value={value}
        />
        <Text
          align="right"
          color={colorForAsset || colors.dark}
          letterSpacing="roundedTight"
          size={isTinyPhone || android ? 'bigger' : 'h3'}
          weight="medium"
        >
          {label.length > labelMaxLength
            ? label.substring(0, labelMaxLength)
            : label}
        </Text>
      </RowWithMargins>
    </Wrapper>
  );
}
