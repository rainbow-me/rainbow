import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Centered } from '../layout';
import { ImgixImage } from '@rainbow-me/images';
import { borders } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const buildSmallShadows = (color, colors) => [
  [0, 3, 5, colors.shadow, 0.14],
  [0, 6, 10, colors.avatarColor[color] || color, 0.2],
];

const sizeConfigs = colors => ({
  large: {
    dimensions: 65,
    shadow: [
      [0, 6, 10, colors.shadow, 0.12],
      [0, 2, 5, colors.shadow, 0.08],
    ],
    textSize: 'bigger',
  },
  medium: {
    dimensions: 40,
    shadow: [
      [0, 4, 6, colors.shadow, 0.04],
      [0, 1, 3, colors.shadow, 0.08],
    ],
    textSize: 'larger',
  },
  small: {
    dimensions: 34,
    textSize: 'large',
  },
  smaller: {
    dimensions: 20,
    textSize: 'small',
  },
});

const Avatar = styled(ImgixImage)`
  height: ${({ dimensions }) => dimensions};
  width: ${({ dimensions }) => dimensions};
`;

const ImageAvatar = ({ image, size = 'medium', ...props }) => {
  const { colors } = useTheme();
  const { dimensions, shadow } = useMemo(() => sizeConfigs(colors)[size], [
    colors,
    size,
  ]);

  const shadows = useMemo(
    () =>
      size === 'small' || size === 'smaller'
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
