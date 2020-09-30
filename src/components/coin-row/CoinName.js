import { Platform } from 'react-native';
import styled from 'styled-components/primitives';
import { TruncatedText } from '../text';

export default styled(TruncatedText).attrs({
  color: 'dark',
  letterSpacing: 'roundedMedium',
  lineHeight: Platform.OS === 'android' ? 'normalTight' : 'normal',
  size: 'lmedium',
})`
  padding-right: ${({ paddingRight }) => paddingRight || 19};
`;
