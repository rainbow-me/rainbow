import { VibrancyView } from '@react-native-community/blur';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
import { neverRerender } from '../../utils';
import { colors } from '@rainbow-me/styles';

export const HandleHeight = 5;

const defaultColor = colors.alpha(colors.blueGreyDark, 0.3);

const SheetHandle = styled.View.attrs(({ showBlur }) => ({
  as: showBlur && ios ? VibrancyView : View,
  blurAmount: 20,
  blurType: 'light',
}))`
  background-color: ${({ color = defaultColor }) => color};
  border-radius: 3;
  height: ${HandleHeight};
  overflow: hidden;
  width: 36;
  z-index: 9;
`;

export default neverRerender(SheetHandle);
