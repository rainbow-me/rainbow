import LayoutWithDividers from './LayoutWithDividers';
import styled from '@/styled-thing';

const RowWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'row',
  dividerHorizontal: false,
})({});

export default RowWithDividers;
