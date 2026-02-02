import Text from './Text';
import styled from '@/styled-thing';
import { opacity } from '@/data/opacity';

const Smallcaps = styled(Text).attrs(({ theme: { colors } }) => ({
  color: opacity(colors.blueGreyDark, 0.8),
  size: 'small',
  uppercase: true,
  weight: 'semibold',
}))({});

export default Smallcaps;
