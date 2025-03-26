import React from 'react';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { Centered } from '../layout';
import SheetHandle, { SHEET_HANDLE_HEIGHT } from './SheetHandle';

const DEFAULT_PADDING_VERTICAL = 6;

type SheetHandleFixedToTopProps = {
  color?: string;
  showBlur?: boolean;
  top?: number;
};

export const SheetHandleFixedToTopHeight = SHEET_HANDLE_HEIGHT + DEFAULT_PADDING_VERTICAL * 2;

const Container = styled(Centered)((props: { paddingTop: number; paddingBottom: number }) => ({
  ...padding.object(props.paddingTop, 0, props.paddingBottom),
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  zIndex: 9,
}));

export default function SheetHandleFixedToTop({ color, showBlur = false, top = DEFAULT_PADDING_VERTICAL }: SheetHandleFixedToTopProps) {
  return (
    <Container paddingTop={top} paddingBottom={Math.max(0, SheetHandleFixedToTopHeight - top)}>
      <SheetHandle color={color} showBlur={showBlur} />
    </Container>
  );
}
