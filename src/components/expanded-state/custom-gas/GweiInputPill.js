import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Input } from '../../inputs';
import { Row } from '../../layout';
import { Text } from '../../text';
import { colors, margin, padding } from '@rainbow-me/styles';

const ANDROID_EXTRA_LINE_HEIGHT = 6;

const GweiPill = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: colors.gradients.lighterGrey,
  end: { x: 0.5, y: 1 },
  start: { x: 0, y: 0 },
}))`
  border-radius: 15;
  ${padding(10, 12)}
  ${margin(0, 6)}
`;

const GweiNumberInput = styled(Input).attrs(({ theme: { colors }, value }) => ({
  color: !value && colors.grey,
  interval: 1,
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  steps: 1,
  textAlign: 'left',
  timing: 'linear',
  weight: 'heavy',
}))`
  ${padding(0, 0, 0, 0)}
  ${margin(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  )}
`;

const GweiLabel = styled(Text).attrs(() => ({
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
  return (
    <ButtonPressAnimation onPress={onPress}>
      <GweiPill>
        <Row>
          <GweiNumberInput
            keyboardType="numeric"
            onBlur={onBlur}
            onChange={onChange}
            onFocus={onFocus}
            placeholder="0"
            placeholderTextColor={colors.grey}
            ref={ref}
            selectionColor={color}
            testID={testID}
            value={!!value && `${value}`}
          />
          <GweiLabel> Gwei</GweiLabel>
        </Row>
      </GweiPill>
    </ButtonPressAnimation>
  );
}

export default React.forwardRef(GweiInputPill);
