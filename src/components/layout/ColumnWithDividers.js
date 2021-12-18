import styled from '@rainbow-me/styled';
import LayoutWithDividers from './LayoutWithDividers';

const ColumnWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'column',
  dividerHorizontal: true,
})({});

export default ColumnWithDividers;
