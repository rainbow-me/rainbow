import React, { Children } from 'react';
import { FlexItem, Row } from '../../layout';
import styled from 'styled-components';
import { padding } from '@rainbow-me/styles';

const Container = styled(Row).attrs({
  justify: 'space-around',
})(
  ({
    ignorePaddingBottom,
    paddingBottom,
    ignorePaddingTop,
    paddingHorizontal,
  }) => ({
    ...padding(
      ignorePaddingTop ? 0 : 19,
      paddingHorizontal || 11.5,
      ignorePaddingBottom ? 0 : 24
    ),

    ...(paddingBottom ? { paddingBottom: paddingBottom } : {}),
    elevation: -1,
    width: '100%',
    zIndex: 2,
  })
);

function renderButton(child) {
  if (!child) return null;
  return <FlexItem marginHorizontal={7.5}>{child}</FlexItem>;
}

export default function SheetActionButtonRow({
  children,
  ignorePaddingBottom,
  ignorePaddingTop,
  paddingBottom = null,
  paddingHorizontal = null,
}) {
  return (
    <Container
      ignorePaddingBottom={ignorePaddingBottom}
      ignorePaddingTop={ignorePaddingTop}
      paddingBottom={paddingBottom}
      paddingHorizontal={paddingHorizontal}
    >
      {Children.map(children, renderButton)}
    </Container>
  );
}
