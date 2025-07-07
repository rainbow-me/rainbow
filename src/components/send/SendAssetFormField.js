import lang from 'i18n-js';
import React, { useCallback } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { BubbleField } from '../fields';
import { Row, RowWithMargins } from '../layout';
import { Text } from '../text';
import { analytics } from '@/analytics';
import styled from '@/styled-thing';
import { IS_ANDROID } from '@/env';
import { IS_SMALL_PHONE, IS_TINY_PHONE, DEVICE_WIDTH } from '@/utils/deviceUtils';

const FieldWidth = DEVICE_WIDTH - 38;

const GradientBackground = styled(RadialGradient).attrs(({ colorForAsset, theme: { colors } }) => {
  return {
    center: [0, (FieldWidth - 38) / 2],
    colors: [colors.alpha(colorForAsset, 0), colors.alpha(colorForAsset, 0.06)],
    stops: [0, 1],
  };
})({
  height: DEVICE_WIDTH - 38,
  left: 0,
  position: 'absolute',
  top: -((DEVICE_WIDTH - 38 - (IS_TINY_PHONE ? 40 : IS_ANDROID || IS_SMALL_PHONE ? 46 : 59)) / 2),
  transform: [{ scaleY: 0.175074184 }],
  width: DEVICE_WIDTH - 38,
});

const Wrapper = styled(IS_ANDROID ? Row : ButtonPressAnimation).attrs({
  scaleTo: 1.05,
})({
  borderRadius: 29.5,
  height: IS_TINY_PHONE ? 40 : IS_SMALL_PHONE ? 46 : 59,
  overflow: 'hidden',
  paddingBottom: IS_TINY_PHONE ? 7 : IS_SMALL_PHONE ? 8 : 11,
  paddingHorizontal: IS_TINY_PHONE ? 12 : IS_SMALL_PHONE ? 15 : 19,
  paddingTop: IS_TINY_PHONE ? 6 : IS_SMALL_PHONE ? 7 : 10,
  position: 'relative',
  width: IS_ANDROID ? DEVICE_WIDTH - 38 : '100%',
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
  const { colors } = useTheme();
  const handlePressMax = useCallback(
    e => {
      analytics.track(analytics.event.sendMaxPressed);
      onPressButton?.(e);
    },
    [onPressButton]
  );

  return (
    <Wrapper isSmallPhone={IS_ANDROID || IS_SMALL_PHONE} isTinyPhone={IS_TINY_PHONE} onPress={() => !IS_ANDROID && ref?.current.focus()}>
      <GradientBackground colorForAsset={colorForAsset} />
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
          lineHeight={IS_ANDROID ? (IS_TINY_PHONE ? 27 : IS_ANDROID || IS_SMALL_PHONE ? 31 : 38) : null}
          size={IS_TINY_PHONE ? 'big' : IS_ANDROID || IS_SMALL_PHONE ? 'bigger' : 'h3'}
          weight="medium"
        >
          {label.length > labelMaxLength ? label.substring(0, labelMaxLength) : label}
        </Text>
      </RowWithMargins>
    </Wrapper>
  );
};

export default React.forwardRef(SendAssetFormField);
