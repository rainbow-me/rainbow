import styled from 'styled-components/primitives';
import LayoutWithMargins from './LayoutWithMargins';

const RowWithMargins = styled(LayoutWithMargins).attrs(({ margin = 19 }) => ({
  direction: 'row',
  margin,
  marginKey: 'marginRight',
}))``;

export default RowWithMargins;
