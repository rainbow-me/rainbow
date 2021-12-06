import React from 'react';
import { View } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import { BaseButton } from 'react-native-gesture-handler';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import { CoinRowHeight } from './CoinRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

const FavoriteButtonPadding = 19;

const FavoriteButton = styled(Centered)`
  ${padding(0, FavoriteButtonPadding)};
  bottom: 0;
  flex: 0;
  height: ${CoinRowHeight};
  position: absolute;
  right: 0;
  top: 0;
  width: 68px;
`;

const Circle = styled(IS_TESTING === 'true' ? View : RadialGradient).attrs(
  ({ isFavorited, theme: { colors, isDarkMode } }) => ({
    center: [0, 15],
    colors: isFavorited
      ? [
          colors.alpha('#FFB200', isDarkMode ? 0.15 : 0),
          colors.alpha('#FFB200', isDarkMode ? 0.05 : 0.2),
        ]
      : colors.gradients.lightestGrey,
  })
)`
  border-radius: 15px;
  height: 30px;
  overflow: hidden;
  width: 30px;
`;

const StarIcon = styled(Text).attrs(({ isFavorited, theme: { colors } }) => ({
  align: 'center',
  color: isFavorited
    ? colors.yellowFavorite
    : colors.alpha(colors.blueGreyDark, 0.2),
  letterSpacing: 'zero',
  size: 'smaller',
  weight: 'heavy',
}))`
  height: 100%;
  line-height: 29px;
  width: 100%;
`;

const CoinRowFavoriteButton = ({ isFavorited, onPress }: any) => {
  const { isDarkMode: darkMode } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FavoriteButton as={BaseButton} onPress={onPress}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Circle darkMode={darkMode} isFavorited={isFavorited}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <StarIcon isFavorited={isFavorited}>􀋃</StarIcon>
      </Circle>
    </FavoriteButton>
  );
};

export default magicMemo(CoinRowFavoriteButton, 'isFavorited');
