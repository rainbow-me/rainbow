import LayoutWithMargins from './LayoutWithMargins';
import styled from '@/styled-thing';

const RowWithMargins = styled(LayoutWithMargins).attrs(({ direction = 'row', margin = 19 }) => ({
  direction,
  margin,
  marginKey: 'marginRight',
}))({});

export default RowWithMargins;
