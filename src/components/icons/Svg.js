import { compact } from 'lodash';
import { compose, mapProps, omitProps } from 'recompact';
import Svg from 'svgs';

const BlacklistedSVGProps = ['direction'];
const reduceStylesToObject = (item, culm) => Object.assign(culm, item);

export default compose(
  omitProps(...BlacklistedSVGProps),
  mapProps(({ style, ...props }) => ({
    ...props,
    style: Array.isArray(style)
      ? compact(style).reduce(reduceStylesToObject, {})
      : style,
  })),
)(Svg);
