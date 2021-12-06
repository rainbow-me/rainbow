import React from 'react';
import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
import { SheetHandle } from '../sheet';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  align: 'center',
  margin: 6,
})`
  ${padding(6, 0)};
`;

export default function ExchangeHeader({ testID, title }: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container testID={`${testID}-header`}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SheetHandle />
      {title && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Text align="center" lineHeight="loose" size="large" weight="heavy">
          {title}
        </Text>
      )}
    </Container>
  );
}
