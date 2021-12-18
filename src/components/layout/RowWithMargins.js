import styled from '@rainbow-me/styled';
import LayoutWithMargins from './LayoutWithMargins';

const RowWithMargins = styled(LayoutWithMargins).attrs(
  ({ direction = 'row', margin = 19 }) => ({
    direction,
    margin,
    marginKey: 'marginRight',
  })
)({});

export default RowWithMargins;
