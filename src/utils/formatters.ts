import GraphemeSplitter from 'grapheme-splitter';
import { isString } from 'lodash';

const grapheme = new GraphemeSplitter();

const firstCharacterOfString = (n: string) => n.charAt(0);

export const getFirstGrapheme = (string: string) => {
  if (!string) return '';
  return grapheme.splitGraphemes(string)[0];
};

export const initials = (string: string) => (!string || !isString(string) ? '?' : string.split(' ').map(firstCharacterOfString).join(''));

export function removeLeadingZeros(value = ''): string {
  if (value.length > 1 && value.substring(0, 1) === '0' && value.substring(1, 2) !== '.') {
    return removeLeadingZeros(value.substring(1));
  }

  if (value.substring(value.length - 1, value.length) === '.' && value.indexOf('.') !== value.length - 1) {
    return value.substring(0, value.length - 1);
  }

  if (value.substring(0, 1) === '.') {
    return `0${value}`;
  }

  return value;
}

export function sanitizeSeedPhrase(string: string): string {
  // trim extraneous whitespaces + remove new lines / line breaks
  return string
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .trim()
    .split(' ')
    .filter((word: string) => !!word)
    .join(' ');
}

export default {
  getFirstGrapheme,
  initials,
  removeLeadingZeros,
  sanitizeSeedPhrase,
};
