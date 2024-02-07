import lang from 'i18n-js';
import React, { useCallback } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { BubbleField } from '../fields';
import { Row, RowWithMargins } from '../layout';
import { Text } from '../text';
import { analytics } from '@/analytics';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';

const GradientBackground = styled(RadialGradient).attrs(({ colorForAsset, theme: { colors }, width }) => {
  const FieldWidth = width - 38;

  return {
    center: [0, (FieldWidth - 38) / 2],
    colors: [colors.alpha(colorForAsset, 0), colors.alpha(colorForAsset, 0.06)],
    stops: [0, 1],
  };
})({
  height: ({ width }) => width - 38,
  left: 0,
  position: 'absolute',
  top: ({ isSmallPhone, isTinyPhone, width }) => -((width - 38 - (isTinyPhone ? 40 : isSmallPhone ? 46 : 59)) / 2),
  transform: [{ scaleY: 0.175074184 }],
  width: ({ width }) => width - 38,
});

const Wrapper = styled(android ? Row : ButtonPressAnimation).attrs({
  scaleTo: 1.05,
})({
  borderRadius: 29.5,
  height: ({ isSmallPhone, isTinyPhone }) => (isTinyPhone ? 40 : isSmallPhone ? 46 : 59),
  overflow: 'hidden',
  paddingBottom: ({ isSmallPhone, isTinyPhone }) => (isTinyPhone ? 7 : isSmallPhone ? 8 : 11),
  paddingHorizontal: ({ isSmallPhone, isTinyPhone }) => (isTinyPhone ? 12 : isSmallPhone ? 15 : 19),
  paddingTop: ({ isSmallPhone, isTinyPhone }) => (isTinyPhone ? 6 : isSmallPhone ? 7 : 10),
  position: 'relative',
  width: ({ width }) => (android ? width - 38 : '100%'),
});

const SendAssetFormField = (
  {
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
  },
  ref
) => {
  const { isTinyPhone, isSmallPhone, width } = useDimensions();
  const { colors } = useTheme();
  const handlePressMax = useCallback(
    event => {
      analytics.track('Clicked "Max" in Send flow input');
      onPressButton?.(event);
    },
    [onPressButton]
  );

  return (
    <Wrapper
      isSmallPhone={android || isSmallPhone}
      isTinyPhone={isTinyPhone}
      onPress={() => !android && ref?.current.focus()}
      width={width}
    >
      <GradientBackground colorForAsset={colorForAsset} isSmallPhone={android || isSmallPhone} isTinyPhone={isTinyPhone} width={width} />
      <RowWithMargins align="center" flex={1} justify="space-between" margin={12} {...props}>
        <BubbleField
          autoFocus={autoFocus}
          buttonText={lang.t('wallet.transaction.max')}
          colorForAsset={colorForAsset || colors.dark}
          format={format}
          keyboardType="decimal-pad"
          mask={mask}
          maxLabelColor={maxLabelColor}
          onChange={onChange}
          onFocus={onFocus}
          onPressButton={handlePressMax}
          placeholder={placeholder}
          ref={ref}
          testID={testID}
          value={value}
        />
        <Text
          align="right"
          color={colorForAsset || colors.dark}
          letterSpacing="roundedTight"
          lineHeight={android ? (isTinyPhone ? 27 : android || isSmallPhone ? 31 : 38) : null}
          size={isTinyPhone ? 'big' : android || isSmallPhone ? 'bigger' : 'h3'}
          weight="medium"
        >
          {label.length > labelMaxLength ? label.substring(0, labelMaxLength) : label}
        </Text>
      </RowWithMargins>
    </Wrapper>
  );
};

export default React.forwardRef(SendAssetFormField);
