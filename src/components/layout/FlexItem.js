import { isUndefined } from 'lodash';
import styled from 'styled-components/primitives';

const FlexItem = styled.View`
  flex: ${({ flex, grow, shrink }) =>
    isUndefined(flex) && isUndefined(grow) && isUndefined(shrink) ? 1 : flex};
  ${({ grow }) => (grow !== undefined ? `flex-grow: ${grow};` : '')}
  ${({ shrink }) => (shrink !== undefined ? `flex-shrink: ${shrink};` : '')}
`;

export default FlexItem;
