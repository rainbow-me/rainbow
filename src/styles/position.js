import { upperFirst } from 'lodash';
import { StyleSheet } from 'react-native';
import { css } from 'styled-components';
import buildLayoutStyles from './buildLayoutStyles';

const position = {};

position.cover = css`
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

position.centered = css`
  align-items: center;
  justify-content: center;
`;

position.centeredAsObject = {
  alignItems: 'center',
  justifyContent: 'center',
};

position.coverAsObject = StyleSheet.absoluteFillObject;

position.layout = (...args) => buildLayoutStyles(args);

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
