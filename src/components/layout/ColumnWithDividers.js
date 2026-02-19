import LayoutWithDividers from './LayoutWithDividers';
import styled from '@/framework/ui/styled-thing';

const ColumnWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'column',
  dividerHorizontal: true,
})({});

export default ColumnWithDividers;
