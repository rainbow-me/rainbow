import LayoutWithDividers from './LayoutWithDividers';
import styled from '@/styled-thing';

const ColumnWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'column',
  dividerHorizontal: true,
})({});

export default ColumnWithDividers;
