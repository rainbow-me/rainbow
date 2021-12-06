import { toLower } from 'lodash';

export default function isLowerCaseMatch(a, b) {
  return toLower(a) === toLower(b);
}
