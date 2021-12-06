import React from 'react';
import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${padding(android ? 19 : 36, 19, 24)};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${({ isNft }) => padding(android ? 19 : 36, isNft ? 24 : 19, 24)};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  padding-top: ${({ isL2, isNft }) => (isL2 || isNft ? 24 : android ? 19 : 36)};
`;

export default function ExpandedStateSection({
  children,
  isNft,
  title,
  ...props
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container isNft={isNft} {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text
        color={isNft ? colors.whiteLabel : colors.dark}
        size="large"
        weight="heavy"
      >
        {title}
      </Text>
      {typeof children === 'string' ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
