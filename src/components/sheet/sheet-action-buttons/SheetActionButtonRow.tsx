import React, { Children, ReactNode } from 'react';
import { FlexItem, Row } from '../../layout';
import styled from '@/styled-thing';
import { padding } from '@/styles';

interface ContainerProps {
  ignorePaddingBottom?: boolean;
  paddingBottom?: number | null;
  ignorePaddingTop?: boolean;
  paddingHorizontal?: number | null;
}

const Container = styled(Row).attrs({
  justify: 'space-around',
})(({ ignorePaddingBottom, paddingBottom, ignorePaddingTop, paddingHorizontal }: ContainerProps) => ({
  ...padding.object(ignorePaddingTop ? 0 : 19, paddingHorizontal || 11.5, ignorePaddingBottom ? 0 : 24),

  ...(paddingBottom && { paddingBottom }),
  elevation: -1,
  width: '100%',
  zIndex: 2,
}));

function renderButton(child: ReactNode) {
  if (!child) return null;
  return <FlexItem marginHorizontal={7.5}>{child}</FlexItem>;
}

interface SheetActionButtonRowProps {
  children: ReactNode;
  ignorePaddingBottom?: boolean;
  ignorePaddingTop?: boolean;
  paddingBottom?: number | null;
  paddingHorizontal?: number | null;
}

export default function SheetActionButtonRow({
  children,
  ignorePaddingBottom = false,
  ignorePaddingTop = false,
  paddingBottom = null,
  paddingHorizontal = null,
}: SheetActionButtonRowProps) {
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
