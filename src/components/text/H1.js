import styled from 'styled-components/primitives';
import Text from './Text';

const H1 = styled(Text).attrs(
  ({ letterSpacing = 'rounded', weight = 'bold' }) => ({
    letterSpacing,
    size: 'big',
    weight,
  })
)``;

export default H1;
