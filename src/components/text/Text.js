import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';

const Text = styled.Text`
  color: ${({ color }) => (colors.get(color) || colors.dark)}
  font-family: ${({ family }) => fonts.family[family || 'SFProText']};
  font-size: ${({ size }) => fonts.size[size || 'medium']};
  font-weight: ${({ weight }) => fonts.weight[weight || 'regular']};
`;

export default withProps({ allowFontScaling: false })(Text);
