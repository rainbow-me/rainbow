import { withProps } from 'recompact';
import Text from '../text/Text';

export default withProps(({ color }) => ({
  align: 'right',
  color: color || 'dark',
  size: 'lmedium',
}))(Text);
