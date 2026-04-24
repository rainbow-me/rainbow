import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { ImgixImage } from '@/components/images';
import { IS_TEST } from '@/env';
import { position } from '@/styles';

import SpinnerImageSource from '../assets/spinner.png';
import { useTheme } from '../theme/ThemeContext';
import { SpinAnimation } from './animations/SpinAnimation';
import { Centered } from './layout';

type SpinnerProps = {
  color?: string;
  duration?: number;
  size?: 'small' | 'large' | number;
  style?: StyleProp<ViewStyle>;
};

const Spinner = ({ color = '', duration = 1500, size = 20, ...props }: SpinnerProps) => {
  const { colors } = useTheme();

  let style;
  switch (size) {
    case 'large':
      style = position.sizeAsObject(36);
      break;
    case 'small':
      style = position.sizeAsObject(20);
      break;
    default:
      style = position.sizeAsObject(size);
  }

  return (
    <Centered {...props}>
      {!IS_TEST && (
        <SpinAnimation duration={duration}>
          <ImgixImage source={SpinnerImageSource as any} style={style} tintColor={color || colors.whiteLabel} size={30} />
        </SpinAnimation>
      )}
    </Centered>
  );
};

export default React.memo(Spinner);
