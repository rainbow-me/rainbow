import GraphemeSplitter from 'grapheme-splitter';
import { isString } from 'lodash';

const grapheme = new GraphemeSplitter();

const firstCharacterOfString = (n: any) => n.charAt(0);

export const getFirstGrapheme = (string: any) => {
  if (!string) return '';
  return grapheme.splitGraphemes(string)[0];
};

export const initials = (string: any) =>
  !string || !isString(string)
    ? '?'
    : string.split(' ').map(firstCharacterOfString).join('');

// @ts-expect-error ts-migrate(7023) FIXME: 'removeLeadingZeros' implicitly has return type 'a... Remove this comment to see the full error message
export function removeLeadingZeros(value = '') {
  if (
    value.length > 1 &&
    value.substring(0, 1) === '0' &&
    value.substring(1, 2) !== '.'
  ) {
    return removeLeadingZeros(value.substring(1));
  }

  if (
    value.substring(value.length - 1, value.length) === '.' &&
    value.indexOf('.') !== value.length - 1
  ) {
    return value.substring(0, value.length - 1);
  }

  if (value.substring(0, 1) === '.') {
    return `0${value}`;
  }

  return value;
}

export function sanitizeSeedPhrase(string: any) {
  // trim extraneous whitespaces + remove new lines / line breaks
  return string
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .trim()
    .split(' ')
    .filter((word: any) => !!word)
    .join(' ');
}

export default {
  getFirstGrapheme,
  initials,
  removeLeadingZeros,
  sanitizeSeedPhrase,
};
