import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module './LayoutWithMargins' was resolved to '/Use... Remove this comment to see the full error message
import LayoutWithMargins from './LayoutWithMargins';

const RowWithMargins = styled(LayoutWithMargins).attrs(
  ({ direction = 'row', margin = 19 }) => ({
    direction,
    margin,
    marginKey: 'marginRight',
  })
)``;

export default RowWithMargins;
