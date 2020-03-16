import { withProps } from 'recompact';
import { colors } from '../../styles';
import Text from './Text';

export default withProps(({ style }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  size: 'small',
  style: [{ textTransform: 'uppercase' }, style],
  weight: 'semibold',
}))(Text);
