import React from 'react';
import { Row } from '../layout';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { safeAreaInsetValues } from '@/utils';

const StatusBarHeight = safeAreaInsetValues.top;
export const HeaderHeight = 44;
export const HeaderHeightWithStatusBar = HeaderHeight + StatusBarHeight;

const Container = styled(Row).attrs(({ align = 'end' }) => ({
  align,
}))({
  height: HeaderHeightWithStatusBar,
  paddingTop: StatusBarHeight,
  width: ({ width }) => width,
  zIndex: 1,
});

export default function Header(props) {
  const { width: deviceWidth } = useDimensions();
  return <Container {...props} width={deviceWidth} />;
}
