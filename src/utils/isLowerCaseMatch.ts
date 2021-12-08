import { toLower } from 'lodash';

export default function isLowerCaseMatch(a: string, b: string) {
  return toLower(a) === toLower(b);
}
