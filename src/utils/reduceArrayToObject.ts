import { compact } from 'lodash';

const reduceArrayToObject = (item: any, culm: any) => Object.assign(culm, item);

export default (array: any) =>
  Array.isArray(array) ? compact(array).reduce(reduceArrayToObject, {}) : array;
