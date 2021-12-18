import styled from '../../styled-thing';
import LayoutWithDividers from './LayoutWithDividers';

const ColumnWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'column',
  dividerHorizontal: true,
})({});

export default ColumnWithDividers;
