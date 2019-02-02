import { withProps } from 'recompact';
import Text from './Text';

export default withProps({
  color: 'blueGreyMedium',
  letterSpacing: 'loose',
  size: 'smaller',
  textTransform: 'uppercase',
  weight: 'semibold',
})(Text);
