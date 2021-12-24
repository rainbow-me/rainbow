import React from 'react';
import { ColumnWithMargins } from '../layout';
import { SheetHandle } from '../sheet';
import { Text } from '../text';
import { padding } from '@rainbow-me/styles';
import styled from 'rainbowed-components';

const Container = styled(ColumnWithMargins).attrs({
  align: 'center',
  margin: 6,
})({
  ...padding.object(6, 0),
});

export default function ExchangeHeader({ testID, title }) {
  return (
    <Container testID={`${testID}-header`}>
      <SheetHandle />
      {title && (
        <Text align="center" lineHeight="loose" size="large" weight="heavy">
          {title}
        </Text>
      )}
    </Container>
  );
}
