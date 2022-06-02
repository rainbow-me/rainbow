import React, { useMemo } from 'react';
import { Centered } from '../layout';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import { borders } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const buildSmallShadows = (color, colors) => [
  [0, 3, 5, colors.shadow, 0.14],
  [0, 6, 10, colors.avatarBackgrounds[color] || color, 0.2],
];

const sizeConfigs = (colors, isDarkMode) => ({
  header: {
    dimensions: 34,
    textSize: 'large',
  },
  large: {
    dimensions: 65,
    shadow: [
      [0, 6, 10, colors.shadow, 0.12],
      [0, 2, 5, colors.shadow, 0.08],
    ],
    textSize: 'bigger',
  },
  lmedium: {
    dimensions: 50,
    shadow: [
      [0, 4, 12, colors.shadow, 0.12],
      [0, 1, 3, colors.shadow, 0.08],
    ],
    textSize: 28,
  },
  medium: {
    dimensions: 40,
    shadow: [[0, 4, 12, colors.shadow, isDarkMode ? 0.3 : 0.15]],
    textSize: 'larger',
  },
  small: {
    dimensions: 30,
    shadow: [[0, 3, 9, colors.shadow, 0.1]],
    textSize: 'lmedium',
  },
  smaller: {
    dimensions: 20,
    textSize: 'small',
  },
});

const Avatar = styled(ImgixImage)(({ dimensions }) => ({
  height: dimensions,
  width: dimensions,
}));

const ImageAvatar = ({ image, size = 'medium', ...props }) => {
  const { colors, isDarkMode } = useTheme();
  const { dimensions, shadow } = useMemo(
    () => sizeConfigs(colors, isDarkMode)[size],
    [colors, isDarkMode, size]
  );

  const shadows = useMemo(
    () =>
      size === 'header' || size === 'smaller'
        ? buildSmallShadows(colors.shadow, colors)
        : shadow,
    [shadow, size, colors]
  );

  return (
    <ShadowStack
      {...props}
      {...borders.buildCircleAsObject(dimensions)}
      backgroundColor={colors.white}
      shadows={shadows}
    >
      <Centered flex={1}>
        <Avatar
          dimensions={dimensions}
          source={{
            uri: image,
          }}
        />
      </Centered>
    </ShadowStack>
  );
};

export default React.memo(ImageAvatar);
