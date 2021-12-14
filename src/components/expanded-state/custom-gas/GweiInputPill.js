import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import TextInputMask from 'react-native-text-input-mask';
import styled from 'styled-components';
import { Row } from '../../../components/layout';
import { ButtonPressAnimation } from '../../animations';
import { Text } from '../../text';
import { buildTextStyles, margin } from '@rainbow-me/styles';

const ANDROID_EXTRA_LINE_HEIGHT = 6;

const GweiPill = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: colors.gradients.lightGreyTransparent,
  end: { x: 0.5, y: 1 },
  start: { x: 0, y: 0 },
}))`
  border-radius: 15;
  height: 40;
  max-width: 130;
  min-width: 108;
`;

const GweiNumberInput = styled(TextInputMask).attrs(
  ({ theme: { colors }, value }) => ({
    color: !value && colors.alpha(colors.blueGreyDark, 0.4),
    interval: 1,
    keyboardAppearance: 'dark',
    keyboardType: 'decimal-pad',
    left: 22,
    letterSpacing: 'rounded',
    paddingLeft: 28,
    paddingRight: 72,
    paddingVertical: 10.5,
    size: 'lmedium',
    textAlign: 'left',
    timing: 'linear',
    weight: 'heavy',
  })
)`
  ${buildTextStyles};
  height: 100%;
  ${margin(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  )};
`;

const GweiLabel = styled(Text).attrs(() => ({
  align: 'center',
  pointerEvents: 'none',
  size: 'lmedium',
  weight: 'heavy',
}))`
  ${margin(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  )}
  right: 50;
  top: 10.5;
`;

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
