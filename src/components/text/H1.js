import { withProps } from 'recompact';
import Text from './Text';

export default withProps(({ letterSpacing, weight }) => ({
  letterSpacing: letterSpacing || 'rounded',
  size: 'big',
  weight: weight || 'bold',
}))(Text);
