import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module './LayoutWithMargins' was resolved to '/Use... Remove this comment to see the full error message
import LayoutWithMargins from './LayoutWithMargins';

const ColumnWithMargins = styled(LayoutWithMargins).attrs(
  ({ direction = 'column', margin = 20 }) => ({
    direction,
    margin,
    marginKey: 'marginBottom',
  })
)``;

export default ColumnWithMargins;
