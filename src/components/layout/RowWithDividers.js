import LayoutWithDividers from './LayoutWithDividers';
import styled from 'rainbowed-components';

const RowWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'row',
  dividerHorizontal: false,
})({});

export default RowWithDividers;
