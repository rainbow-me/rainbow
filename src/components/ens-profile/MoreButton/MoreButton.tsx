import React from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import ThreeDotsIcon from '../../icons/svg/ThreeDotsIcon';
import { Box, useForegroundColor } from '@rainbow-me/design-system';

export default function MoreButton() {
  const backgroundColor = useForegroundColor('secondary10');
  const color = useForegroundColor('secondary80');
  return (
    <Box
      alignItems="center"
      as={ButtonPressAnimation}
      borderRadius={40}
      height="40px"
      justifyContent="center"
      style={{ backgroundColor, width: 40 }}
    >
      {/* @ts-expect-error JavaScript component */}
      <ThreeDotsIcon color={color} tightDots />
    </Box>
  );
}
