import { compact } from 'lodash';

const reduceStylesToObject = (item, culm) => Object.assign(culm, item);

export default style => (
  Array.isArray(style)
    ? compact(style).reduce(reduceStylesToObject, {})
    : style
);
