import { pick } from 'lodash';
import isEqual from 'react-fast-compare';

export default function isNewValueForObjectPaths(a: any, b: any, paths: any) {
  return !isEqual(pick(a, paths), pick(b, paths));
}
