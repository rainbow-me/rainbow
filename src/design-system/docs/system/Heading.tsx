import classnames from 'classnames';
import React, { ReactNode } from 'react';

import { sprinkles } from './sprinkles.css';
import { FontWeight, ForegroundColor } from './tokens.css';
import { HeadingSizes, letterSpacings, sizes } from './typography.css';

type Levels = '1' | '2' | '3' | '4';

export const Heading = ({
  children,
  color = 'primary (Deprecated)',
  level,
  size = '23px / 27px (Deprecated)',
  weight,
}: {
  children: ReactNode;
  color?: ForegroundColor;
  level?: Levels;
  size?: HeadingSizes;
  weight: FontWeight;
}) => {
  let Component: any = 'span';
  if (level) {
    Component = `h${level}`;
  }

  return (
    <Component
      className={classnames([
        sprinkles({
          color,
          fontWeight: weight,
          letterSpacing: letterSpacings.heading[size],
        }),
        sizes.heading[size],
      ])}
    >
      {children}
    </Component>
  );
};
