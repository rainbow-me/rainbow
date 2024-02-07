import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import TextInputMask from 'react-native-text-input-mask';
import { Row } from '../../../components/layout';
import { Text } from '../../text';
import styled from '@/styled-thing';
import { buildTextStyles, margin, padding } from '@/styles';

const ANDROID_EXTRA_LINE_HEIGHT = 8;

const PillGradient = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: colors.gradients.lightGreyTransparent,
  end: { x: 0.5, y: 1 },
  start: { x: 0, y: 0 },
}))({
  borderRadius: 15,
  height: 40,
  ...(ios ? { height: 40 } : padding.object(10, 12)),
  maxWidth: 130,
  minWidth: 108,
  ...(android ? { marginHorizontal: 5 } : {}),
});

const NumberInput = styled(TextInputMask).attrs(({ theme: { colors }, value }) => ({
  color: !value && colors.alpha(colors.blueGreyDark, 0.4),
  interval: 1,
  keyboardAppearance: 'dark',
  keyboardType: 'decimal-pad',
  letterSpacing: 'rounded',
  size: 'lmedium',
  textAlign: 'left',
  timing: 'linear',
  weight: 'heavy',
  ...(ios && {
    height: '100%',
    left: 22,
    paddingLeft: 28,
    paddingRight: 72,
    paddingVertical: 10.5,
  }),
}))(props => ({
  ...buildTextStyles.object(props),
  ...(android ? padding.object(0, 0, 0, 0) : {}),
  ...margin.object(android ? -ANDROID_EXTRA_LINE_HEIGHT : 0, 0, android ? -ANDROID_EXTRA_LINE_HEIGHT : 0, 0),
}));

const Label = styled(Text).attrs(() => ({
  align: 'center',
  pointerEvents: 'none',
  size: 'large',
  weight: 'heavy',
}))({
  ...margin.object(android ? -ANDROID_EXTRA_LINE_HEIGHT : 0, 0, android ? -ANDROID_EXTRA_LINE_HEIGHT : 0, 0),
  ...(ios ? { right: 40 } : {}),
  top: android ? -0.5 : 8.5,
});

function InputPill({ color, label, onChange: onChangeCallback, onFocus, onBlur, testID, value }, ref) {
  const { colors } = useTheme();

  const onChangeText = useCallback(
    text => {
      text = text === '.' || text === ',' ? `0${text}` : text;
      onChangeCallback(text);
    },
    [onChangeCallback]
  );

  return (
    <PillGradient>
      <Row alignSelf="center" marginHorizontal={-40}>
        <NumberInput
          allowFontScaling={false}
          contextMenuHidden
          mask="[9999]{.}[999]"
          onBlur={onBlur}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder="0"
          placeholderTextColor={colors.alpha(colors.blueGreyDark, 0.4)}
          ref={ref}
          selectionColor={color}
          spellCheck={false}
          style={{ color: colors.dark }}
          testID={testID}
          value={value}
          {...(android &&
            color && {
              selectionColor: colors.alpha(color, 0.4),
            })}
        />
        <Label>{label}</Label>
      </Row>
    </PillGradient>
  );
}

export default React.forwardRef(InputPill);
