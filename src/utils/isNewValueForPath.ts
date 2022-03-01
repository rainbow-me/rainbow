import { get } from 'lodash';

export default function isNewValueForPath(a: any, b: any, path: any) {
  return get(a, path) !== get(b, path);
}
