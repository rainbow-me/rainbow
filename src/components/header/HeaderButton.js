import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';

const HeaderButton = styled(ButtonPressAnimation).attrs(
  ({ scaleTo = 0.8 }) => ({
    compensateForTransformOrigin: true,
    scaleTo,
  })
)`
  ${padding(10, 19, 8)};
`;

export default HeaderButton;
