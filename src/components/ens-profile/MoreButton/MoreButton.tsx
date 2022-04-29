import React from 'react';
import ThreeDotsIcon from '../../icons/svg/ThreeDotsIcon';
import ActionButton from '../ActionButtons/ActionButton';
import { useForegroundColor } from '@rainbow-me/design-system';

export default function MoreButton() {
  const color = useForegroundColor('secondary80');
  return (
    <ActionButton
      // @ts-expect-error JavaScript component
      icon={<ThreeDotsIcon color={color} smallDots />}
      variant="outlined"
    />
  );
}
