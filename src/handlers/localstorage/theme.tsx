import { getGlobal, saveGlobal } from './common';

const THEME = 'theme';

/**
 * @desc get theme
 * @return {String}
 */
export const getTheme = () => getGlobal(THEME, 'light');

/**
 * @desc save theme
 */
export const saveTheme = theme => saveGlobal(THEME, theme);
