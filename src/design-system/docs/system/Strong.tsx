import classnames from 'classnames';
import React, { ReactNode } from 'react';

import { sprinkles } from './sprinkles.css';

export const Strong = ({ children }: { children: ReactNode }) => (
  <span
    className={classnames([
      sprinkles({
        fontWeight: 'bold',
      }),
    ])}
  >
    {children}
  </span>
);
