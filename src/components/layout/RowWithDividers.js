import LayoutWithDividers from './LayoutWithDividers';
import styled from '@rainbow-me/styled-components';

const RowWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'row',
  dividerHorizontal: false,
})({});

export default RowWithDividers;
