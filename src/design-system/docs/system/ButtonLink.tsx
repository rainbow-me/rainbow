import React from 'react';

import { ButtonOverlay, ButtonOverlayProps } from './Button';

type ButtonLinkProps = ButtonOverlayProps & {
  href: string;
};

export const ButtonLink = ({ children, color, iconBefore, href, size }: ButtonLinkProps) => (
  <a href={href} rel="noreferrer" target="_blank">
    <ButtonOverlay color={color} iconBefore={iconBefore} size={size}>
      {children}
    </ButtonOverlay>
  </a>
);
