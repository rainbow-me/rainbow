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
        bottom: 0,
        left: 0,
        paddingLeft: '4px',
        position: 'absolute',
        top: 0,
      })}
    />
  </div>
);
