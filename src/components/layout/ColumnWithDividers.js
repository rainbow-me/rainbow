import LayoutWithDividers from './LayoutWithDividers';
import styled from 'rainbowed-components';

const ColumnWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'column',
  dividerHorizontal: true,
})({});

export default ColumnWithDividers;
