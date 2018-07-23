import { compose, setDisplayName, withProps } from 'recompact';
import Flex from './Flex';

export default compose(
  setDisplayName('Column'),
  withProps({ direction: 'column' }),
)(Flex);
