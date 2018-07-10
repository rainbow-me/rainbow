import { compose, setDisplayName, withProps } from 'recompose';
import Flex from './Flex';

export default compose(
  setDisplayName('Row'),
  withProps({ direction: 'row' }),
)(Flex);
