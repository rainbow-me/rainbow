import React from 'react';
import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
import { Text } from '../text';
import { padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
})`
  ${padding(android ? 19 : 36, 19, 24)};
  padding-top: ${({ isL2, isNft }) => (isL2 || isNft ? 24 : android ? 19 : 36)};
`;

export default function ExpandedStateSection({
  children,
  isNft,
  title,
  ...props
}) {
  const { colors } = useTheme();
  return (
    <Container isNft={isNft} {...props}>
      <Text color={colors.dark} size="larger" weight="heavy">
        {title}
      </Text>
      {typeof children === 'string' ? (
        <Text
          color={colors.alpha(colors.blueGreyDark, 0.5)}
          lineHeight="paragraphSmall"
          size="lmedium"
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Container>
  );
}
