import React, { ReactNode } from 'react';

import { sprinkles } from './sprinkles.css';

export const Blockquote = ({ children }: { children: ReactNode }) => (
  <div
    className={sprinkles({
      backgroundColor: 'actionTint (Deprecated)',
      color: 'actionShade (Deprecated)',
      paddingHorizontal: '24px',
      paddingVertical: '24px',
      position: 'relative',
    })}
  >
    {children}
    <div
      className={sprinkles({
        backgroundColor: 'action (Deprecated)',
        bottom: 'none',
        left: 'none',
        paddingLeft: '4px',
        position: 'absolute',
        top: 'none',
      })}
    />
  </div>
);
