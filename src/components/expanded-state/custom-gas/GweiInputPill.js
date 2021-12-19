import styled from '@terrysahaidak/style-thing';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import TextInputMask from 'react-native-text-input-mask';
import { Row } from '../../../components/layout';
import { ButtonPressAnimation } from '../../animations';
import { Text } from '../../text';
import { buildTextStyles, margin, padding } from '@rainbow-me/styles';

const ANDROID_EXTRA_LINE_HEIGHT = 6;

const GweiPill = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
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

const GweiNumberInput = styled(TextInputMask).attrs(
  ({ theme: { colors }, value }) => ({
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
  })
)(props => ({
  ...buildTextStyles.object(props),
  ...(android ? padding.object(0, 0, 0, 0) : {}),
  ...margin.object(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  ),
}));

const GweiLabel = styled(Text).attrs(() => ({
  align: 'center',
  pointerEvents: 'none',
  size: 'lmedium',
  weight: 'heavy',
}))({
  ...margin.object(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  ),
  ...(ios ? { right: 50, top: 10.5 } : {}),
});

function GweiInputPill(
  { value, onPress, onChange, onFocus, onBlur, testID, color },
  ref
) {
  const { colors } = useTheme();

  return (
    <ButtonPressAnimation onPress={onPress}>
      <GweiPill>
        <Row alignSelf="center" marginHorizontal={-40}>
          <GweiNumberInput
            contextMenuHidden
            mask="[9999]{.}[999]"
            onBlur={onBlur}
            onChange={onChange}
            onFocus={onFocus}
            placeholder="0"
            placeholderTextColor={colors.alpha(colors.blueGreyDark, 0.4)}
            ref={ref}
            selectionColor={color}
            spellCheck={false}
            style={{ color: colors.dark }}
            testID={testID}
            value={value}
          />
          <GweiLabel> Gwei</GweiLabel>
        </Row>
      </GweiPill>
    </ButtonPressAnimation>
  );
}

export default React.forwardRef(GweiInputPill);
