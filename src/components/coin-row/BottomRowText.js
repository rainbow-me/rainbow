import { withProps } from 'recompact';
import { TruncatedText } from '../text';
import { colors } from '@rainbow-me/styles';

export default withProps(({ align, color }) => ({
  align: align || 'left',
  color: color || colors.alpha(colors.blueGreyDark, 0.5),
  size: 'smedium',
}))(TruncatedText);
