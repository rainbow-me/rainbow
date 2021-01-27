import styled from 'styled-components';
import LayoutWithMargins from './LayoutWithMargins';

const ColumnWithMargins = styled(LayoutWithMargins).attrs(
  ({ direction = 'column', margin = 20 }) => ({
    direction,
    margin,
    marginKey: 'marginBottom',
  })
)``;

export default ColumnWithMargins;
