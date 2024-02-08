import React, { ReactNode } from 'react';

import { Inline } from './Inline';
import { sprinkles } from './sprinkles.css';
import { TextSizes } from './typography.css';

type ButtonColor = 'action (Deprecated)';
type ButtonSize = 'default' | 'small';

export type ButtonOverlayProps = {
  children: ReactNode;
  color?: ButtonColor;
  iconBefore?: React.ReactNode;
  size?: ButtonSize;
};

const fontSizes = {
  default: '18px / 27px (Deprecated)',
  small: '14px / 19px (Deprecated)',
} as { [key: string]: TextSizes };

export const ButtonOverlay = ({ children, color, iconBefore, size = 'default' }: ButtonOverlayProps) => (
  <div
    className={sprinkles({
      color,
      fontSize: fontSizes[size],
      fontWeight: 'bold',
    })}
  >
    <Inline alignVertical="center" space="4px">
      {iconBefore && (
        <div
          style={{
            display: 'flex',
            height: '0.75em',
            width: '0.75em',
          }}
        >
          {iconBefore}
        </div>
      )}
      {children}
    </Inline>
  </div>
);

export const Button = ({
  children,
  color,
  iconBefore,
  onClick,
  size,
}: ButtonOverlayProps & {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) => (
  <button onClick={onClick} type="button">
    <ButtonOverlay color={color} iconBefore={iconBefore} size={size}>
      {children}
    </ButtonOverlay>
  </button>
);
