import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import React from 'react';

type NavbarIconProps = {
  icon: React.ElementType;
};

export function NavbarSvgIcon({ icon: Icon }: NavbarIconProps) {
  const color = useForegroundColor('primary (Deprecated)');
  return <Icon color={color} />;
}
