import { withProps } from 'recompact';
import { Monospace } from '../text';

export default withProps(({ color }) => ({
  color: color || 'dark',
  size: 'lmedium',
}))(Monospace);
