import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module './LayoutWithDividers' was resolved to '/Us... Remove this comment to see the full error message
import LayoutWithDividers from './LayoutWithDividers';

const RowWithDividers = styled(LayoutWithDividers).attrs({
  direction: 'row',
  dividerHorizontal: false,
})``;

export default RowWithDividers;
