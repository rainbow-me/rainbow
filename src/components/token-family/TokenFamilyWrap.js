import { times } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import TokenFamilyHeader, {
  TokenFamilyHeaderAnimationDuration,
} from './TokenFamilyHeader';
import { useTimeout } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';

export const TokenFamilyWrapPaddingTop = 6;

const Container = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.white,
  overflow: 'hidden',
  paddingTop: ({ isFirst }) => (isFirst ? TokenFamilyWrapPaddingTop : 0),
});

const Content = styled.View({
  paddingTop: ({ areChildrenVisible }) =>
    areChildrenVisible ? TokenFamilyWrapPaddingTop : 0,
});

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

  const showChildren = useCallback(() => {
    if (!areChildrenVisible) {
      setAreChildrenVisible(true);
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
      <Content areChildrenVisible={areChildrenVisible}>
        {areChildrenVisible ? times(item.length, renderItem) : null}
      </Content>
    </Container>
  );
}
