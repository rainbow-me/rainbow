import React, { ReactNode } from 'react';

import { sprinkles } from './sprinkles.css';
import { Space } from './tokens.css';

export const Stack = ({ space, children }: { space: Space; children: ReactNode }) => (
  <div
    className={sprinkles({
      display: 'flex',
      flexDirection: 'column',
      gap: space,
    })}
  >
    {children}
  </div>
);
