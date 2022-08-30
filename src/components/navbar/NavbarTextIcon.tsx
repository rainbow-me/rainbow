import React from 'react';
import { Text } from '@/design-system';

type NavbarIconProps = {
  icon: string;
};

export function NavbarTextIcon({ icon }: NavbarIconProps) {
  return (
    <Text size="23px" weight="semibold">
      {icon}
    </Text>
  );
}
