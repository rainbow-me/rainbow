import styled from 'styled-components/primitives';
import LayoutWithDividers from './LayoutWithDividers';

const RowWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'row',
  dividerHorizontal: false,
})``;

export default RowWithDividers;
