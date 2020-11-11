import React, { useMemo } from 'react';
import { Image } from 'react-native';
import styled from 'styled-components';
import { Centered } from '../layout';
import { borders, colors } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const buildSmallShadows = color => [
  [0, 3, 5, colors.dark, 0.14],
  [0, 6, 10, colors.avatarColor[color] || color, 0.2],
];

const sizeConfigs = {
  large: {
    dimensions: 65,
    shadow: [
      [0, 6, 10, colors.dark, 0.12],
      [0, 2, 5, colors.dark, 0.08],
    ],
    textSize: 'bigger',
  },
  medium: {
    dimensions: 40,
    shadow: [
      [0, 4, 6, colors.dark, 0.04],
      [0, 1, 3, colors.dark, 0.08],
    ],
    textSize: 'larger',
  },
  small: {
    dimensions: 34,
    textSize: 'large',
  },
};

const Avatar = styled(Image)`
  height: ${({ dimensions }) => dimensions};
  width: ${({ dimensions }) => dimensions};
`;

const ImageAvatar = ({ image, size = 'medium', ...props }) => {
  const { dimensions, shadow } = sizeConfigs[size];

  const shadows = useMemo(
    () => (size === 'small' ? buildSmallShadows(colors.dark) : shadow),
    [shadow, size]
  );

  return (
    <ShadowStack
      {...props}
      {...borders.buildCircleAsObject(dimensions)}
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
