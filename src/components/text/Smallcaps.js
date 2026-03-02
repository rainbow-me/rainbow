import Text from './Text';
import styled from '@/framework/ui/styled-thing';
import { opacity } from '@/framework/ui/utils/opacity';

const Smallcaps = styled(Text).attrs(({ theme: { colors } }) => ({
  color: opacity(colors.blueGreyDark, 0.8),
  size: 'small',
  uppercase: true,
  weight: 'semibold',
}))({});

export default Smallcaps;
