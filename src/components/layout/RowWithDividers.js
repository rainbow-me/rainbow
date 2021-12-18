import styled from '@terrysahaidak/style-thing';
import LayoutWithDividers from './LayoutWithDividers';

const RowWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'row',
  dividerHorizontal: false,
})({});

export default RowWithDividers;
