import { pick } from 'lodash';
import isEqual from 'react-fast-compare';

export default function isNewValueForObjectPaths(
  a: {},
  b: {},
  paths: string | string[]
) {
  return !isEqual(pick(a, paths), pick(b, paths));
}
