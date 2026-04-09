import React from 'react';

import ThreeDotsIcon from '@/components/icons/svg/ThreeDotsIcon';
import { useForegroundColor } from '@/design-system';

import ActionButton from './ActionButtons/ActionButton';

export default function MoreButton() {
  const color = useForegroundColor('secondary80 (Deprecated)');
  return (
    <ActionButton
      // @ts-expect-error JavaScript component
      icon={<ThreeDotsIcon color={color} smallDots />}
      variant="outlined"
    />
  );
}
