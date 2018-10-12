import { withProps } from 'recompact';
import { colors } from '../../styles';
import { Monospace } from '../text';

export default withProps(({ color }) => ({
  color: color || colors.blueGreyLight,
  size: 'smedium',
}))(Monospace);
