import { VibrancyView } from '@react-native-community/blur';
import { Platform, View } from 'react-native';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { neverRerender } from '../../utils';

export const HandleHeight = 5;

const SheetHandle = styled.View.attrs(({ showBlur }) => ({
  as: showBlur && Platform.OS === 'ios' ? VibrancyView : View,
  blurAmount: 20,
  blurType: 'light',
}))`
  background-color: ${colors.alpha(colors.blueGreyDark, 0.3)};
  border-radius: 3;
  height: ${HandleHeight};
  overflow: hidden;
  width: 36;
`;

export default neverRerender(SheetHandle);
