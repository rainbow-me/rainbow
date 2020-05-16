import styled from 'styled-components/primitives';
import LayoutWithMargins from './LayoutWithMargins';

const ColumnWithMargins = styled(LayoutWithMargins).attrs(
  ({ margin = 20 }) => ({
    direction: 'column',
    margin,
    marginKey: 'marginBottom',
  })
)``;

export default ColumnWithMargins;
