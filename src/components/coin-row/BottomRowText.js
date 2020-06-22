import { withProps } from 'recompact';
import { colors } from '../../styles';
import { TruncatedText } from '../text';

export default withProps(({ align, color }) => ({
  align: align || 'left',
  color: color || colors.alpha(colors.blueGreyDark, 0.5),
  size: 'smedium',
}))(TruncatedText);
