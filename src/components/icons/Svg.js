import { compose, mapProps, omitProps } from 'recompact';
import Svg from 'svgs';
import { reduceStylesArrayToObject } from '../../utils';

const BlacklistedSVGProps = ['direction'];

export default compose(
  omitProps(...BlacklistedSVGProps),
  mapProps(({ style, ...props }) => ({
    ...props,
    style: reduceStylesArrayToObject(style),
  })),
)(Svg);
