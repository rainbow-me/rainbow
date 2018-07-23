import { compose, setDisplayName, withProps } from 'recompact';
import Flex from './Flex';

export default compose(
  setDisplayName('Row'),
  withProps({ direction: 'row' }),
)(Flex);
