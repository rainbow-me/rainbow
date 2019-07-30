import { withProps } from 'recompact';
import { colors } from '../../styles';
import { Monospace, TruncatedText } from '../text';

export default withProps(({ color }) => ({
  color: color || colors.alpha(colors.blueGreyDark, 0.5),
  component: Monospace,
  size: 'smedium',
}))(TruncatedText);
