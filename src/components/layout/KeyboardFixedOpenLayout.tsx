import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import Centered from './Centered';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions, useKeyboardHeight } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const Container = styled(Transitioning.View)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'Transiti... Remove this comment to see the full error message
  height: ${({ height }) => height};
  left: 0;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  position: ${android ? 'relative' : 'absolute'};
  right: 0;
  top: 0;
`;

const InnerWrapper = styled(Centered)`
  ${position.size('100%')};
  padding-bottom: 10;
  padding-top: ${({ insets }) => insets.top};
`;

const transition = (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Transition.Change durationMs={150} interpolation="easeOut" />
);

export default function KeyboardFixedOpenLayout({
  additionalPadding = 0,
  ...props
}) {
  const insets = useSafeArea();
  const { height: screenHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const ref = useRef();
  const containerHeight =
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    screenHeight - (ios && keyboardHeight) - additionalPadding;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  ios &&
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => ref.current.animateNextTransition(), [containerHeight]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container height={containerHeight} ref={ref} transition={transition}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <KeyboardAvoidingView behavior="height" enabled={!!keyboardHeight}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <InnerWrapper {...props} insets={insets} />
      </KeyboardAvoidingView>
    </Container>
  );
}
