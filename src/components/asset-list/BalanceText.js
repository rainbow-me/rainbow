import { withProps } from 'recompact';
import { Monospace } from '../text';

export default withProps((props) => ({
  color: 'blueGreyDark',
  size: 'lmedium',
  ...props,
}))(Monospace);
