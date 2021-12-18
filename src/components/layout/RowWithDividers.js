import styled from '@rainbow-me/styled';
import LayoutWithDividers from './LayoutWithDividers';

const RowWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'row',
  dividerHorizontal: false,
})({});

export default RowWithDividers;
