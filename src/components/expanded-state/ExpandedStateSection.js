import React from 'react';
import { ColumnWithMargins } from '../layout';
import { Text } from '../text';
import styled from '@rainbow-me/styled';
import { padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
})(({ isNft, isL2 }) => ({
  ...padding.object(android ? 19 : 36, 19, 24),
  paddingTop: isL2 || isNft ? 24 : android ? 19 : 36,
  ...padding.object(android ? 19 : 36, isNft ? 24 : 19, 24),
}));

export default function ExpandedStateSection({
  children,
  isNft,
  title,
  ...props
}) {
  const { colors } = useTheme();
  return (
    <Container isNft={isNft} {...props}>
      <Text
        color={isNft ? colors.whiteLabel : colors.dark}
        size="large"
        weight="heavy"
      >
        {title}
      </Text>
      {typeof children === 'string' ? (
        <Text
          color={
            isNft
              ? colors.alpha(colors.whiteLabel, 0.5)
              : colors.alpha(colors.blueGreyDark, 0.5)
          }
          lineHeight="big"
          size="large"
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Container>
  );
}
