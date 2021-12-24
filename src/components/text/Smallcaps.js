import Text from './Text';
import styled from 'rainbowed-components';

const Smallcaps = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  size: 'small',
  uppercase: true,
  weight: 'semibold',
}))({});

export default Smallcaps;
