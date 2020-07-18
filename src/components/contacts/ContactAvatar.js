import { toUpper } from 'lodash';
import React, { useMemo } from 'react';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import { getFirstGrapheme } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';
import { borders, colors } from '@rainbow-me/styles';

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

const ContactAvatar = ({ color, size = 'medium', value, ...props }) => {
  const { dimensions, shadow, textSize } = sizeConfigs[size];

  const shadows = useMemo(
    () => (size === 'small' ? buildSmallShadows(color) : shadow),
    [color, shadow, size]
  );

  return (
    <ShadowStack
      {...props}
      {...borders.buildCircleAsObject(dimensions)}
      backgroundColor={colors.avatarColor[color] || color}
      shadows={shadows}
    >
      <Centered flex={1}>
        <Text align="center" color="white" size={textSize} weight="bold">
          {value && getFirstGrapheme(toUpper(value))}
        </Text>
      </Centered>
    </ShadowStack>
  );
};

export default React.memo(ContactAvatar);
