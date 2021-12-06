import { isUndefined } from 'lodash';
import styled from 'styled-components';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const FlexItem = styled.View`
  flex: ${({ flex, grow, shrink }: any) =>
    isUndefined(flex) && isUndefined(grow) && isUndefined(shrink) ? 1 : flex};
  ${({ grow }: any) => (grow !== undefined ? `flex-grow: ${grow};` : '')}
  ${({ shrink }: any) =>
    shrink !== undefined ? `flex-shrink: ${shrink};` : ''}
`;

export default FlexItem;
