import LayoutWithMargins from './LayoutWithMargins';
import styled from '@rainbow-me/styled-components';

const RowWithMargins = styled(LayoutWithMargins).attrs(
  ({ direction = 'row', margin = 19 }) => ({
    direction,
    margin,
    marginKey: 'marginRight',
  })
)({});

export default RowWithMargins;
