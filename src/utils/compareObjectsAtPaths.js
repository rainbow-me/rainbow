import { pick } from 'lodash';
import isEqual from 'react-fast-compare';

export default function compareObjectsAtPaths(a, b, paths) {
  return !isEqual(pick(a, paths), pick(b, paths));
}
