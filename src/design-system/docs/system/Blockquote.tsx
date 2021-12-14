import React, { ReactNode } from 'react';

import { sprinkles } from './sprinkles.css';

export const Blockquote = ({ children }: { children: ReactNode }) => (
  <div
    className={sprinkles({
      backgroundColor: 'actionTint',
      color: 'actionShade',
      paddingHorizontal: '24px',
      paddingVertical: '24px',
      position: 'relative',
    })}
  >
    {children}
    <div
      className={sprinkles({
        backgroundColor: 'action',
        bottom: 'none',
        left: 'none',
        paddingLeft: '4px',
        position: 'absolute',
        top: 'none',
      })}
    />
  </div>
);
