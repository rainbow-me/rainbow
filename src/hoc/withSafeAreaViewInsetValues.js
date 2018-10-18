import { withProps } from 'recompact';
import safeAreaInsetValues from '../utils/safeAreaInsetValues';

export default Component => withProps({ safeAreaInset: safeAreaInsetValues })(Component);
