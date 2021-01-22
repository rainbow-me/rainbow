import React from 'react';
import { BaseButton } from 'react-native-gesture-handler';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import { colors_NOT_REACTIVE, padding } from '@rainbow-me/styles';
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

const Circle = styled(RadialGradient).attrs(({ isFavorited, darkMode }) => ({
  center: [0, 15],
  colors: isFavorited
    ? [
        colors_NOT_REACTIVE.alpha('#FFB200', darkMode ? 0.15 : 0),
        colors_NOT_REACTIVE.alpha('#FFB200', darkMode ? 0.05 : 0.2),
      ]
    : colors_NOT_REACTIVE.gradients.favoriteCircle,
}))`
  border-radius: 15px;
  height: 30px;
  overflow: hidden;
  width: 30px;
`;

const StarIcon = styled(Text).attrs(({ isFavorited }) => ({
  align: 'center',
  color: isFavorited
    ? colors_NOT_REACTIVE.yellowFavorite
    : colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.blueGreyDark, 0.2),
  letterSpacing: 'zero',
  size: 'smaller',
  weight: 'heavy',
}))`
  height: 100%;
  line-height: 28px;
  width: 100%;
`;

const CoinRowFavoriteButton = ({ isFavorited, onPress }) => {
  const { isDarkMode: darkMode } = useTheme();

  return (
    <FavoriteButton as={BaseButton} onPress={onPress}>
      <Circle darkMode={darkMode} isFavorited={isFavorited}>
        <StarIcon isFavorited={isFavorited}>􀋃</StarIcon>
      </Circle>
    </FavoriteButton>
  );
};

export default magicMemo(CoinRowFavoriteButton, 'isFavorited');
