import styled from 'styled-components';
import LayoutWithDividers from './LayoutWithDividers';

const RowWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'row',
  dividerHorizontal: false,
})``;

export default RowWithDividers;
