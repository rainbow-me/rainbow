import { compact } from 'lodash';

const reduceArrayToObject = (item, culm) => Object.assign(culm, item);

export default array =>
  Array.isArray(array) ? compact(array).reduce(reduceArrayToObject, {}) : array;
