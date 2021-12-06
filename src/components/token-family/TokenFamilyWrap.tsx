import { times } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components';
import TokenFamilyHeader, {
  TokenFamilyHeaderAnimationDuration,
  // @ts-expect-error ts-migrate(6142) FIXME: Module './TokenFamilyHeader' was resolved to '/Use... Remove this comment to see the full error message
} from './TokenFamilyHeader';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useTimeout } from '@rainbow-me/hooks';

export const TokenFamilyWrapPaddingTop = 6;

const transition = (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Transition.In
    durationMs={75}
    interpolation="easeIn"
    propagation="top"
    type="fade"
  />
);

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  background-color: ${({ theme: { colors } }: any) => colors.white};
  overflow: hidden;
  padding-top: ${({ isFirst }: any) =>
    isFirst ? TokenFamilyWrapPaddingTop : 0};
`;

const Content = styled(Transitioning.View).attrs({ transition })`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'areChildrenVisible' does not exist on ty... Remove this comment to see the full error message
  padding-top: ${({ areChildrenVisible }) =>
    areChildrenVisible ? TokenFamilyWrapPaddingTop : 0};
`;

export default function TokenFamilyWrap({
  childrenAmount,
  isFirst,
  isHeader,
  isOpen,
  item,
  onToggle,
  renderItem,
  title,
  ...props
}: any) {
  const [areChildrenVisible, setAreChildrenVisible] = useState(false);
  const [startTimeout, stopTimeout] = useTimeout();
  const transitionRef = useRef();

  const showChildren = useCallback(() => {
    if (!areChildrenVisible) {
      setAreChildrenVisible(true);
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'animateNextTransition' does not exist on... Remove this comment to see the full error message
      transitionRef.current?.animateNextTransition();
    }
  }, [areChildrenVisible]);

  useEffect(() => {
    stopTimeout();
    if (areChildrenVisible && !isOpen) {
      setAreChildrenVisible(false);
    } else if (!areChildrenVisible && isOpen) {
      startTimeout(showChildren, TokenFamilyHeaderAnimationDuration);
    }
  }, [areChildrenVisible, isOpen, showChildren, startTimeout, stopTimeout]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container isFirst={isFirst}>
      {isHeader ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <TokenFamilyHeader
          {...props}
          childrenAmount={childrenAmount}
          isOpen={isOpen}
          onPress={onToggle}
          title={title}
        />
      ) : null}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content areChildrenVisible={areChildrenVisible} ref={transitionRef}>
        {areChildrenVisible ? times(item.length, renderItem) : null}
      </Content>
    </Container>
  );
}
