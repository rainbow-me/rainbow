import React from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from '../../animations';
import { magicMemo } from '@/utils';
import { useTheme } from '@/theme';
import { IS_TEST } from '@/env';
import { Text } from '@/design-system';

const SafeRadialGradient = IS_TEST ? View : RadialGradient;

const ChartAddToFavoritesButton = ({ toggleFavorite, favorite }) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <ButtonPressAnimation onPress={toggleFavorite}>
      <SafeRadialGradient
        center={[0, 20]}
        colors={
          favorite
            ? [
                colors.alpha('#FFB200', isDarkMode ? 0.15 : 0),
                colors.alpha('#FFB200', isDarkMode ? 0.05 : 0.2),
              ]
            : colors.gradients.lightestGrey
        }
        style={{
          alignItems: 'center',
          borderRadius: 20,
          height: 40,
          justifyContent: 'center',
          overflow: 'hidden',
          width: 40,
        }}
      >
        <Text
          ellipsizeMode="tail"
          align="center"
          size="18px / 27px (Deprecated)"
          numberOfLines={1}
          color={{
            custom: favorite
              ? colors.yellowFavorite
              : colors.alpha(colors.blueGreyDark, 0.2),
          }}
        >
          􀋃
        </Text>
      </SafeRadialGradient>
    </ButtonPressAnimation>
  );
};

export default magicMemo(ChartAddToFavoritesButton, ['asset']);
