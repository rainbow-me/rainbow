import { createContext } from 'react';

import { type ButtonPressAnimationProps } from './types';

/**
 * Default actions supplied by a compound control to its animated child buttons.
 * Buttons inherit missing actions; an explicit button action stops inheritance below that button.
 */
export const ButtonPressContext = createContext<Pick<ButtonPressAnimationProps, 'onPress' | 'onLongPress'> | null>(null);
