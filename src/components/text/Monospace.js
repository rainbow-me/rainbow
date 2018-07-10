import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';

const Monospace = styled.Text`
  color: ${({ color }) => (color || colors.dark)}
  font-family: ${fonts.family.SFMono};
  font-size: ${({ size }) => fonts.size[size || 'medium']};
  font-weight: ${({ weight }) => fonts.weight[weight || 'regular']};
`;

export default Monospace;

