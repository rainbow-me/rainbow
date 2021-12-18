import LayoutWithDividers from './LayoutWithDividers';
import styled from 'styled-components';

const RowWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'row',
  dividerHorizontal: false,
})({});

export default RowWithDividers;
