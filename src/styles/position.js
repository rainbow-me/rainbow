import { upperFirst } from 'lodash';
import { StyleSheet } from 'react-native';
import { css } from 'styled-components';

const position = {};

position.absCenter = css`
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
`;

position.absCenterHorizontal = css`
  left: 50%;
  position: absolute;
  transform: translateX(-50%);
`;

position.absCenterVertical = css`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
`;

position.cover = css`
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

position.coverAsObject = StyleSheet.absoluteFillObject;

const buildSizeKey = (prefix, key) => (prefix ? upperFirst(key) : key);

position.size = (size, prefix = '') => css`
  ${prefix}${buildSizeKey(prefix, 'height')}: ${size};
  ${prefix}${buildSizeKey(prefix, 'width')}: ${size};
`;

position.sizeAsObject = (size, prefix = '') => ({
  [`${prefix}${buildSizeKey(prefix, 'height')}`]: size,
  [`${prefix}${buildSizeKey(prefix, 'width')}`]: size,
});

position.maxSize = size => position.size(size, 'max');
position.minSize = size => position.size(size, 'min');

position.maxSizeAsObject = size => position.sizeAsObject(size, 'max');
position.minSizeAsObject = size => position.sizeAsObject(size, 'min');

export default position;
