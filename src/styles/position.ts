import { upperFirst } from 'lodash';
import { StyleSheet } from 'react-native';
import buildLayoutStyles from './buildLayoutStyles';

const position = {};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'cover' does not exist on type '{}'.
position.cover = `
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'centered' does not exist on type '{}'.
position.centered = `
  align-items: center;
  justify-content: center;
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'centeredAsObject' does not exist on type... Remove this comment to see the full error message
position.centeredAsObject = {
  alignItems: 'center',
  justifyContent: 'center',
};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'coverAsObject' does not exist on type '{... Remove this comment to see the full error message
position.coverAsObject = StyleSheet.absoluteFillObject;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type '{}'.
position.layout = (...args: any[]) => buildLayoutStyles(args);

const buildSizeKey = (prefix: any, key: any) =>
  prefix ? upperFirst(key) : key;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type '{}'.
position.size = (size: any, prefix = '') => `
  ${prefix}${buildSizeKey(prefix, 'height')}: ${size};
  ${prefix}${buildSizeKey(prefix, 'width')}: ${size};
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'sizeAsObject' does not exist on type '{}... Remove this comment to see the full error message
position.sizeAsObject = (size, prefix = '') => ({
  [`${prefix}${buildSizeKey(prefix, 'height')}`]: size,
  [`${prefix}${buildSizeKey(prefix, 'width')}`]: size,
});

// @ts-expect-error ts-migrate(2339) FIXME: Property 'maxSize' does not exist on type '{}'.
position.maxSize = (size: any) => position.size(size, 'max');
// @ts-expect-error ts-migrate(2339) FIXME: Property 'minSize' does not exist on type '{}'.
position.minSize = (size: any) => position.size(size, 'min');

// @ts-expect-error ts-migrate(2339) FIXME: Property 'maxSizeAsObject' does not exist on type ... Remove this comment to see the full error message
position.maxSizeAsObject = (size: any) => position.sizeAsObject(size, 'max');
// @ts-expect-error ts-migrate(2339) FIXME: Property 'minSizeAsObject' does not exist on type ... Remove this comment to see the full error message
position.minSizeAsObject = (size: any) => position.sizeAsObject(size, 'min');

export default position;
