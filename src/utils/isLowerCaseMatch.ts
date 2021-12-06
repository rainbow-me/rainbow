import { toLower } from 'lodash';

export default function isLowerCaseMatch(a: any, b: any) {
  return toLower(a) === toLower(b);
}
