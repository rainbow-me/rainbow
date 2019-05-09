import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import Flex from './layout/Row';
import { colors } from '../styles/index';

export default styled(Flex)`
 left: 0;
 top: 0;
 right: 0;
 bottom: 0;
  position: absolute;
  margin: 7px;
  background-color: ${({ highlight }) => (highlight ? colors.highlightBackground : colors.white)};
  border-radius: 10;
`;
