import { upperFirst } from 'lodash';
import { StyleSheet } from 'react-native';
import buildLayoutStyles from './buildLayoutStyles';
import { memoFn } from '@/utils/memoFn';

const position = {};

position.cover = `
  bottom: 0,
  left: 0;
  position: 'absolute',
  right: 0;
  top: 0;
`;

position.centered = `
  alignItems: 'center',
  justifyContent: 'center',
`;

position.centeredAsObject = {
  alignItems: 'center',
  justifyContent: 'center',
};

position.coverAsObject = StyleSheet.absoluteFillObject;

position.layout = (...args) => buildLayoutStyles(args);

const buildSizeKey = (prefix, key) => (prefix ? upperFirst(key) : key);

position.size = (size, prefix = '') => `
  ${prefix}${buildSizeKey(prefix, 'height')}: ${size};
  ${prefix}${buildSizeKey(prefix, 'width')}: ${size};
`;

position.sizeAsObject = memoFn((size, prefix = '') => ({
  [`${prefix}${buildSizeKey(prefix, 'height')}`]: size,
  [`${prefix}${buildSizeKey(prefix, 'width')}`]: size,
}));

position.maxSize = size => position.size(size, 'max');
position.minSize = size => position.size(size, 'min');

position.maxSizeAsObject = size => position.sizeAsObject(size, 'max');
position.minSizeAsObject = size => position.sizeAsObject(size, 'min');

export default position;
