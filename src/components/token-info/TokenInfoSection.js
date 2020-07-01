import styled from 'styled-components/primitives';
import { ColumnWithMargins } from '../layout';
import { padding } from '@rainbow-me/styles';

const TokenInfoSection = styled(ColumnWithMargins).attrs({
  margin: 15,
})`
  ${padding(24, 0, 5)};
  width: 100%;
`;

export default TokenInfoSection;
