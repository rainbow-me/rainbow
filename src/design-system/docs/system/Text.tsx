import classnames from 'classnames';
import React, { ReactNode } from 'react';

import { sprinkles } from './sprinkles.css';
import { FontWeight, ForegroundColor } from './tokens.css';
import { letterSpacings, sizes, TextSizes } from './typography.css';

export const Text = ({
  children,
  color,
  size = '18px / 27px (Deprecated)',
  weight = 'regular',
}: {
  children: ReactNode;
  color?: ForegroundColor;
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
