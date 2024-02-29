import classnames from 'classnames';
import React, { ReactNode } from 'react';

import { sprinkles } from './sprinkles.css';

export const TextLink = ({ children, href }: { children: ReactNode; href: string }) => (
  <a
    className={classnames([
      sprinkles({
        color: 'action (Deprecated)',
        textDecoration: { hover: 'underline' },
      }),
    ])}
    href={href}
    rel="noopener noreferrer"
    target="_blank"
  >
    {children}
  </a>
);
