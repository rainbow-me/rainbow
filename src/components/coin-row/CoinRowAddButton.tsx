import React from 'react';
import { View } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import { CoinRowHeight } from './CoinRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

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

const Circle = styled(IS_TESTING === 'true' ? View : RadialGradient).attrs(
  ({ theme: { colors } }) => ({
    center: [0, 15],
    colors: colors.gradients.lightestGrey,
  })
)`
  border-radius: 15px;
  height: 30px;
  overflow: hidden;
  width: 30px;
`;

const Icon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  letterSpacing: 'zero',
  size: 'lmedium',
  weight: 'bold',
}))`
  height: 100%;
  line-height: 29px;
  width: 100%;
`;

const CoinRowAddButton = ({ onPress }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <AddButton>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <ButtonPressAnimation onPress={onPress}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Circle>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Icon>􀅼</Icon>
      </Circle>
    </ButtonPressAnimation>
  </AddButton>
);

export default magicMemo(CoinRowAddButton, 'isFavorited');
