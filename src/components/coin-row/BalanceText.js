import { withProps } from 'recompact';
import { Monospace } from '../text';

export default withProps(({ color }) => ({
  color: color || 'blueGreyDark',
  size: 'lmedium',
}))(Monospace);
