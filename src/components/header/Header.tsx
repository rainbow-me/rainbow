import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import styled from 'styled-components';
import { Row } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';

const StatusBarHeight = getStatusBarHeight(true);
export const HeaderHeight = 44;
export const HeaderHeightWithStatusBar = HeaderHeight + StatusBarHeight;

const Container = styled(Row).attrs(({ align = 'end' }) => ({
  align,
}))`
  height: ${HeaderHeightWithStatusBar};
  padding-top: ${StatusBarHeight};
  width: ${({ width }) => width};
  z-index: 1;
`;

export default function Header(props: any) {
  const { width: deviceWidth } = useDimensions();
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <Container {...props} width={deviceWidth} />;
}
