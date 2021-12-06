import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Input } from '../../inputs';
import { Row } from '../../layout';
import { Text } from '../../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin, padding } from '@rainbow-me/styles';

const ANDROID_EXTRA_LINE_HEIGHT = 6;

const GweiPill = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: colors.gradients.lighterGrey,
  end: { x: 0.5, y: 1 },
  start: { x: 0, y: 0 },
}))`
  border-radius: 15;
  ${padding(10, 12)}
  ${margin(0, 6)}
  min-width: 105;
`;

const GweiNumberInput = styled(Input).attrs(({ theme: { colors }, value }) => ({
  color: !value && colors.grey,
  interval: 1,
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  steps: 1,
  textAlign: 'center',
  timing: 'linear',
  weight: 'heavy',
}))`
  ${padding(0, 0, 0, 0)}
  ${margin(
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  )}
`;

function GweiInputPill(
  { value, onPress, onChange, onFocus, onBlur, testID, color }: any,
  ref: any
) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation onPress={onPress}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <GweiPill>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row alignSelf="center">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <GweiNumberInput
            keyboardType="numeric"
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <GweiLabel> Gwei</GweiLabel>
        </Row>
      </GweiPill>
    </ButtonPressAnimation>
  );
}

export default React.forwardRef(GweiInputPill);
