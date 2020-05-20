import React from 'react';
import { borders, colors } from '../../styles';
import { getFirstGrapheme } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';

export default function ContactAvatar({ color, large, value, ...props }) {
  return (
    <Centered
      {...props}
      {...borders.buildCircleAsObject(large ? 60 : 40)}
      backgroundColor={colors.avatarColor[color]}
    >
      <Text
        align="center"
        color="white"
        size={large ? 'biggest' : 'large'}
        weight="semibold"
      >
        {getFirstGrapheme(value)}
      </Text>
    </Centered>
  );
}
