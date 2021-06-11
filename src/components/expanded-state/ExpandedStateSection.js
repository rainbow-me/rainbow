import React from 'react';
import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
import { Text } from '../text';
import { padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
})`
  ${padding(android ? 10 : 19, 19, android ? 12 : 24)};
`;

export default function ExpandedStateSection({ children, title, ...props }) {
  const { colors } = useTheme();
  return (
    <Container {...props}>
      <Text color={colors.dark} size="larger" weight="bold">
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
