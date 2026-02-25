import LayoutWithDividers from './LayoutWithDividers';
import styled from '@/framework/ui/styled-thing';

const RowWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'row',
  dividerHorizontal: false,
})({});

export default RowWithDividers;
