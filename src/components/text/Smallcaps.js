import styled from 'styled-components/primitives';
import Text from './Text';

const Smallcaps = styled(Text).attrs({
  color: 'blueGreyMedium',
  size: 'smaller',
  weight: 'semibold',
})`
  letter-spacing: 0.46px;
  text-transform: uppercase;
`;

export default Smallcaps;
