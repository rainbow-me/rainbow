import React from 'react';
import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
import { Text } from '../text';
import { padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
})`
  ${padding(android ? 19 : 36, 19, 24)};
  ${({ isNft }) => padding(android ? 19 : 36, isNft ? 24 : 19, 24)};
  ${({ isTokenHistory }) => padding(android ? 19 : 36, isTokenHistory ? 0 : 19, 24)};
  padding-top: ${({ isL2, isNft, isTokenHistory }) => isL2 || isNft || isTokenHistory ? 24 : android ? 19 : 36};
`;

export default function ExpandedStateSection({
  children,
  isNft,
  title,
  isTokenHistory,
  ...props
}) {
  const { colors } = useTheme();
  return (
    <>
      {isTokenHistory ? (
        <Container isTokenHistory={isTokenHistory} {...props}>
          <Text
            color={isTokenHistory ? colors.whiteLabel : colors.dark}
            size="large"
            style={{ paddingLeft: 19 }}
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
      ) : (
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
      )}
    </>
  );
}
