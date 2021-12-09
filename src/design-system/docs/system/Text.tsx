import classnames from 'classnames';
import React, { ReactNode } from 'react';

import { sprinkles } from './sprinkles.css';
import { FontWeight, TextColor } from './tokens.css';
import { letterSpacings, sizes, TextSizes } from './typography.css';

export const Text = ({
  children,
  color,
  size = '18px',
  weight = 'regular',
}: {
  children: ReactNode;
  color?: TextColor;
  size?: TextSizes;
  weight?: FontWeight;
}) => (
  <span
    className={classnames([
      sprinkles({
        color,
        fontWeight: weight,
        letterSpacing: letterSpacings.text[size],
      }),
      sizes.text[size],
    ])}
  >
    {children}
  </span>
);
