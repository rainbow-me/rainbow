import styled from 'styled-components/primitives';
import LayoutWithDividers from './LayoutWithDividers';

const ColumnWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'column',
  dividerHorizontal: true,
})``;

export default ColumnWithDividers;
