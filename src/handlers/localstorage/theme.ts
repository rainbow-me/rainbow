import { getGlobal, saveGlobal } from './common';

export const THEME = 'theme';

/**
 * @desc get theme
 * @return {String}
 */
export const getTheme = () => getGlobal(THEME, 'light');

/**
 * @desc save theme
 */
export const saveTheme = (theme: any) => saveGlobal(THEME, theme);
