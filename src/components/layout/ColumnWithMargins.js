import styled from '@terrysahaidak/style-thing';
import LayoutWithMargins from './LayoutWithMargins';

const ColumnWithMargins = styled(LayoutWithMargins).attrs(
  ({ direction = 'column', margin = 20 }) => ({
    direction,
    margin,
    marginKey: 'marginBottom',
  })
)({});

export default ColumnWithMargins;
