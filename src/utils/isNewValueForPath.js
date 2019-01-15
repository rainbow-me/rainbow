import { get } from 'lodash';

export default function isNewValueForPath(a, b, path) {
  return get(a, path) !== get(b, path);
}
