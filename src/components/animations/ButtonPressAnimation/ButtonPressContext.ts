import { createContext } from 'react';

import { type ButtonPressAnimationProps } from './types';

/**
 * Actions supplied by a compound control, which also owns their accessibility target.
 * Buttons inherit missing actions; an explicit button action stops inheritance below that button.
 */
export const ButtonPressContext = createContext<Pick<ButtonPressAnimationProps, 'onPress' | 'onLongPress'> | null>(null);
