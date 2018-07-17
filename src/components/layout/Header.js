import styled from 'styled-components/primitives';
import Row from './Row';
import { padding } from '../../styles';

const Header = styled(Row).attrs({ align: 'end' })`
  ${padding(0, 19, 20)}
  flex-shrink: 0;
  height: 54;
  width: 100%;
`;

export default Header;
