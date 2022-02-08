import React from 'react';
import { ColumnWithMargins } from '../layout';
import { Text } from '../text';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
<<<<<<< HEAD
})`
  ${padding(android ? 19 : 36, 19, 24)};
  ${({ isNft }) => padding(android ? 19 : 36, isNft ? 24 : 19, 24)};
  ${({ isTokenHistory }) =>
    padding(android ? 19 : 36, isTokenHistory ? 0 : 19, 24)};
  padding-top: ${({ isL2, isNft, isTokenHistory }) =>
    isL2 || isNft || isTokenHistory ? 24 : android ? 19 : 36};
`;
=======
})(({ isNft, isL2 }) => ({
  ...padding.object(android ? 19 : 36, 19, 24),
  ...padding.object(android ? 19 : 36, isNft ? 24 : 19, 24),
  paddingTop: isL2 || isNft ? 24 : android ? 19 : 36,
}));
>>>>>>> 3dd5ecfc0c0471f257e9ee0c92d26e32f40d132c

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
