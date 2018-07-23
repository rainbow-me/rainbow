import { compose, setDisplayName, withProps } from 'recompact';
import Flex from './Flex';

export default compose(
  setDisplayName('Column'),
  withProps({ align: 'center', justify: 'center' }),
)(Flex);
