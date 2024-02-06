import React from 'react';
import { View } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { BaseButton } from 'react-native-gesture-handler';
import RadialGradient from 'react-native-radial-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { magicMemo } from '@/utils';

const FavoriteButtonPadding = 19;

const FavoriteButton = styled(Centered)({
  ...padding.object(0, FavoriteButtonPadding),
  bottom: 0,
  flex: 0,
  height: CoinRowHeight,
  position: 'absolute',
  right: 0,
  top: 0,
  width: 68,
});

const Circle = styled(IS_TESTING === 'true' ? View : RadialGradient).attrs(({ isFavorited, theme: { colors, isDarkMode } }) => ({
  center: [0, 15],
  colors: isFavorited
    ? [colors.alpha('#FFB200', isDarkMode ? 0.15 : 0), colors.alpha('#FFB200', isDarkMode ? 0.05 : 0.2)]
    : colors.gradients.lightestGrey,
}))({
  borderRadius: 15,
  height: 30,
  overflow: 'hidden',
  width: 30,
});

const StarIcon = styled(Text).attrs(({ isFavorited, theme: { colors } }) => ({
  align: 'center',
  color: isFavorited ? colors.yellowFavorite : colors.alpha(colors.blueGreyDark, 0.2),
  letterSpacing: 'zero',
  size: 'smaller',
  weight: 'heavy',
}))({
  height: '100%',
  lineHeight: 29,
  width: '100%',
});

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
