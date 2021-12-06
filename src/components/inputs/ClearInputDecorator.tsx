import React, { useEffect, useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const Button = styled(Centered).attrs({
  scaleTo: 0.8,
})`
  ${({ size }) => position.size(size)};
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  bottom: 0;
  flex: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

const TextIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  letterSpacing: 'zero',
  size: 'large',
  weight: 'bold',
}))`
  margin-bottom: 0.5px;
`;

const duration = 100;
const transition = (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Transition.Sequence>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Together>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.Out
        durationMs={duration * 0.666}
        interpolation="easeIn"
        type="fade"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.Out
        durationMs={duration * 0.42}
        interpolation="easeIn"
        type="scale"
      />
    </Transition.Together>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Change durationMs={duration} interpolation="easeInOut" />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Together>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.In
        durationMs={duration}
        interpolation="easeOut"
        type="fade"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.In
        durationMs={duration * 0.5}
        interpolation="easeOut"
        type="scale"
      />
    </Transition.Together>
  </Transition.Sequence>
);

const ClearInputDecorator = ({
  inputHeight,
  isVisible,
  onPress,
  testID,
}: any) => {
  const transitionRef = useRef();

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'animateNextTransition' does not exist on... Remove this comment to see the full error message
  useEffect(() => transitionRef.current?.animateNextTransition(), [isVisible]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      {isVisible && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Transitioning.View ref={transitionRef} transition={transition}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Button
            as={ButtonPressAnimation}
            onPress={onPress}
            size={inputHeight}
            testID={testID}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <TextIcon>􀁡</TextIcon>
          </Button>
        </Transitioning.View>
      )}
    </Container>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(ClearInputDecorator, 'isVisible');
