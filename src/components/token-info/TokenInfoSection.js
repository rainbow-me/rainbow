import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import { ColumnWithMargins } from '../layout';

const TokenInfoSection = styled(ColumnWithMargins).attrs({
  margin: 15,
})`
  ${padding(24, 0, 5)};
  width: 100%;
`;

export default TokenInfoSection;
