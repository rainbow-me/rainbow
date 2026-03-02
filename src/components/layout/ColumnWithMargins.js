import LayoutWithMargins from './LayoutWithMargins';
import styled from '@/framework/ui/styled-thing';

const ColumnWithMargins = styled(LayoutWithMargins).attrs(({ direction = 'column', margin = 20 }) => ({
  direction,
  margin,
  marginKey: 'marginBottom',
}))({});

export default ColumnWithMargins;
