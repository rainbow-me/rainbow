import styled from 'styled-components/primitives';
import { fonts } from '../../styles';

const Monospace = styled.Text`
  font-family: ${fonts.family.SFMono};
  font-size: ${({ size }) => fonts.size[size || 'medium']};
  font-weight: ${({ weight }) => fonts.weight[weight || 'regular']};
`;

export default Monospace;

