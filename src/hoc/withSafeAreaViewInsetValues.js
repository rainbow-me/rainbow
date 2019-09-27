import { withProps } from 'recompact';
import { safeAreaInsetValues } from '../utils';

export default Component =>
  withProps({ safeAreaInset: safeAreaInsetValues })(Component);
