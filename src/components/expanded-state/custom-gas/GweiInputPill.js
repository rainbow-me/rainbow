import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import TextInputMask from 'react-native-text-input-mask';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Text } from '../../text';
import { buildTextStyles, margin, padding } from '@rainbow-me/styles';

const ANDROID_EXTRA_LINE_HEIGHT = 6;

const GweiPill = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: colors.gradients.lighterGrey,
  end: { x: 0.5, y: 1 },
  flexDirection: 'row',
  start: { x: 0, y: 0 },
}))`
  border-radius: 15;
  ${padding(10, 12)}
  ${margin(0, 6)}
  min-width: 105;
`;

const GweiNumberInput = styled(TextInputMask).attrs(
  ({ theme: { colors }, value }) => ({
    allowFontScaling: false,
    color: !value && colors.grey,
    flex: 1,
    keyboardType: 'decimal-pad',
    letterSpacing: 'roundedTight',
    size: 'lmedium',
    textAlign: 'center',
    weight: 'heavy',
  })
)`
  ${buildTextStyles}
  ${padding(0, 0, 0, 0)}
  ${margin(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  )}
`;

const GweiLabel = styled(Text).attrs(() => ({
  align: 'center',
  size: 'lmedium',
  weight: 'heavy',
}))`
  ${margin(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  )}
`;

function GweiInputPill(
  { value, onPress, onChange, onFocus, onBlur, testID, color },
  ref
) {
  const { colors } = useTheme();
  return (
    <ButtonPressAnimation onPress={onPress}>
      <GweiPill>
        <GweiNumberInput
          keyboardType="numeric"
          mask="[99999999999999999].[999999999999999999]"
          onBlur={onBlur}
          onChange={onChange}
          onFocus={onFocus}
          placeholder="0"
          placeholderTextColor={colors.alpha(colors.blueGreyDark, 0.4)}
          ref={ref}
          selectionColor={color}
          testID={testID}
          value={!!value && `${value}`}
        />
        <GweiLabel> Gwei</GweiLabel>
      </GweiPill>
    </ButtonPressAnimation>
  );
}

export default React.forwardRef(GweiInputPill);
