import { times } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { useTimeout } from '../../hooks';
import TokenFamilyHeader, {
  TokenFamilyHeaderAnimationDuration,
} from './TokenFamilyHeader';
import { colors } from '@rainbow-me/styles';

export const TokenFamilyWrapPaddingTop = 6;

const transition = (
  <Transition.In
    durationMs={75}
    interpolation="easeIn"
    propagation="top"
    type="fade"
  />
);

const Container = styled.View`
  background-color: ${colors.white};
  overflow: hidden;
  padding-top: ${({ isFirst }) => (isFirst ? TokenFamilyWrapPaddingTop : 0)};
`;

const Content = styled(Transitioning.View).attrs({ transition })`
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
}) {
  const [areChildrenVisible, setAreChildrenVisible] = useState(false);
  const [startTimeout, stopTimeout] = useTimeout();
  const transitionRef = useRef();

  const showChildren = useCallback(() => {
    if (!areChildrenVisible) {
      setAreChildrenVisible(true);
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
    <Container isFirst={isFirst}>
      {isHeader ? (
        <TokenFamilyHeader
          {...props}
          childrenAmount={childrenAmount}
          isOpen={isOpen}
          onPress={onToggle}
          title={title}
        />
      ) : null}
      <Content areChildrenVisible={areChildrenVisible} ref={transitionRef}>
        {areChildrenVisible ? times(item.length, renderItem) : null}
      </Content>
    </Container>
  );
}
