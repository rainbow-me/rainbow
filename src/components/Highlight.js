import styled from 'styled-components/primitives';
import { colors } from '../styles/index';
import Flex from './layout/Row';

export default styled(Flex)`
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  margin: 7px;
  background-color: ${({ highlight }) => (highlight ? colors.highlightBackground : colors.transparent)};
  border-radius: 10;
`;
