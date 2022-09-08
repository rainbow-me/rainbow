import classnames from 'classnames';
import React, { ReactNode } from 'react';

import { sprinkles } from './sprinkles.css';

export const Code = ({ children }: { children: ReactNode }) => (
  <code
    className={classnames([
      sprinkles({
        backgroundColor: 'actionTint (Deprecated)',
        borderRadius: '4px',
        color: 'action (Deprecated)',
        fontWeight: 'medium',
        paddingHorizontal: '2px',
      }),
    ])}
  >
    {children}
  </code>
);
