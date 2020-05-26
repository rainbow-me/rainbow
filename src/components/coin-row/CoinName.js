import styled from 'styled-components/primitives';
import { TruncatedText } from '../text';

export default styled(TruncatedText).attrs({
  color: 'dark',
  letterSpacing: 'roundedMedium',
  size: 'lmedium',
})`
  padding-right: ${({ paddingRight = 19 }) => paddingRight};
`;
