import { omitProps } from 'recompact';
import Svg from 'svgs';

const BlacklistedSVGProps = ['direction'];

export default omitProps(...BlacklistedSVGProps)(Svg);
