import toLower from 'lodash/toLower';

export default function isLowerCaseMatch(a: string, b: string) {
  return toLower(a) === toLower(b);
}
