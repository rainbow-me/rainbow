import LayoutWithDividers from './LayoutWithDividers';
import styled from '@rainbow-me/styled-components';

const ColumnWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'column',
  dividerHorizontal: true,
})({});

export default ColumnWithDividers;
