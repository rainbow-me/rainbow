import analytics from '@segment/analytics-react-native';
import React, { useCallback, useRef } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { BubbleField } from '../fields';
import { Row, RowWithMargins } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
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
  top: ${({ isSmallPhone, isTinyPhone, width }) =>
    -((width - 38 - (isTinyPhone ? 40 : isSmallPhone ? 46 : 59)) / 2)};
  transform: scaleY(0.175074184);
  width: ${({ width }) => width - 38};
`;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const Wrapper = styled(android ? Row : ButtonPressAnimation).attrs({
  scaleTo: 1.05,
})`
  border-radius: 29.5;
  height: ${({ isSmallPhone, isTinyPhone }) =>
    isTinyPhone ? 40 : isSmallPhone ? 46 : 59};
  overflow: hidden;
  padding-bottom: ${({ isSmallPhone, isTinyPhone }) =>
    isTinyPhone ? 7 : isSmallPhone ? 8 : 11};
  padding-horizontal: ${({ isSmallPhone, isTinyPhone }) =>
    isTinyPhone ? 12 : isSmallPhone ? 15 : 19};
  padding-top: ${({ isSmallPhone, isTinyPhone }) =>
    isTinyPhone ? 6 : isSmallPhone ? 7 : 10};
  position: relative;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  width: ${({ width }) => (android ? width - 38 : '100%')};
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
}: any) {
  const { isTinyPhone, isSmallPhone, width } = useDimensions();
  const { colors } = useTheme();
  const handlePressMax = useCallback(
    event => {
      analytics.track('Clicked "Max" in Send flow input');
      onPressButton?.(event);
    },
    [onPressButton]
  );
  const bubbleField = useRef();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Wrapper
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      isSmallPhone={android || isSmallPhone}
      isTinyPhone={isTinyPhone}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      onPress={() => !android && bubbleField.current.focus()}
      width={width}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <GradientBackground
        colorForAsset={colorForAsset}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        isSmallPhone={android || isSmallPhone}
        isTinyPhone={isTinyPhone}
        width={width}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RowWithMargins
        align="center"
        flex={1}
        justify="space-between"
        margin={12}
        {...props}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
          onPressButton={handlePressMax}
          placeholder={placeholder}
          ref={bubbleField}
          testID={testID}
          value={value}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text
          align="right"
          color={colorForAsset || colors.dark}
          letterSpacing="roundedTight"
          lineHeight={
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
            android
              ? isTinyPhone
                ? 27
                : // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
                android || isSmallPhone
                ? 31
                : 38
              : null
          }
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          size={isTinyPhone ? 'big' : android || isSmallPhone ? 'bigger' : 'h3'}
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
