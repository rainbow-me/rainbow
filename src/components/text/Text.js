import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { buildTextStyles } from '../../styles';

const Text = styled.Text`
  ${buildTextStyles}
`;

export default withProps({ allowFontScaling: false })(Text);
