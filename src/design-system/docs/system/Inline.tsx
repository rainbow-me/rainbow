import React, { ReactNode } from 'react';

import { sprinkles } from './sprinkles.css';
import { Space } from './tokens.css';

export const Inline = ({
  alignHorizontal = 'left',
  alignVertical,
  space,
  children,
}: {
  alignHorizontal?: 'left' | 'center' | 'right';
  alignVertical?: 'top' | 'center' | 'bottom';
  space: Space;
  children: ReactNode;
}) => (
  <div
    className={sprinkles({
      alignItems: alignVertical,
      display: 'flex',
      flexDirection: 'row',
      gap: space,
      justifyContent: alignHorizontal,
    })}
  >
    {children}
  </div>
);
