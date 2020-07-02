import { toUpper } from 'lodash';
import React from 'react';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import { getFirstGrapheme } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';
import { borders, colors } from '@rainbow-me/styles';

const defaultShadow = [
  [0, 4, 6, colors.dark, 0.04],
  [0, 1, 3, colors.dark, 0.08],
];

const sizeTypes = {
  large: 'large',
  medium: 'medium',
  small: 'small',
};

const ContactAvatar = ({ color, size = sizeTypes.medium, value, ...props }) => {
  const sizeConfigs = {
    large: {
      dimensions: 60,
      shadows: defaultShadow,
      textSize: 'bigger',
    },
    medium: {
      dimensions: 40,
      shadows: defaultShadow,
      textSize: 'larger',
    },
    small: {
      dimensions: 34,
      shadows: [
        [0, 3, 5, colors.dark, 0.14],
        [0, 6, 10, colors.avatarColor[color] || color, 0.2],
      ],
      textSize: 'large',
    },
  };
  const { dimensions, shadows, textSize } = sizeConfigs[size];

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
