import React from 'react';
import styled from 'styled-components';
import { Centered, Column } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import { CoinRowHeight } from './CoinRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const AddButtonPadding = 19;

const AddButton = styled(Centered)`
  ${padding(0, AddButtonPadding)};
  bottom: 0;
  flex: 0;
  height: ${CoinRowHeight};
  position: absolute;
  right: 0;
  top: 0;
  width: 68px;
`;

const Icon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.2),
  letterSpacing: 'zero',
  size: 'larger',
  weight: 'normal',
}))`
  height: 100%;
  line-height: 28px;
  width: 100%;
  margin-top: 28px;
`;

const CoinRowDetailsIcon = () => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <AddButton as={Column}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Icon>􀁴</Icon>
  </AddButton>
);

export default CoinRowDetailsIcon;
