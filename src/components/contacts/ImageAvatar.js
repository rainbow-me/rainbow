import React, { useMemo } from 'react';
import { Centered } from '../layout';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { borders } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';
import { IS_ANDROID } from '@/env';
import { useAccountAccentColor } from '@/hooks';
import { useColorMode } from '@/design-system';

const buildSmallShadows = (color, colors) => [
  [0, 3, 5, colors.shadow, 0.14],
  [0, 6, 10, colors.avatarBackgrounds[color] || color, 0.2],
];

const sizeConfigs = (accentColor, colors, isDarkMode) => ({
  header: {
    dimensions: 36,
    textSize: 'large',
    shadow: [
      [0, 4, 12, !isDarkMode && accentColor ? accentColor : colors.shadow, isDarkMode ? 0.16 : 0.2],
      [0, 2, 6, colors.trueBlack, 0.02],
    ],
  },
  large: {
    dimensions: 60,
    shadow: [
      [0, 6, 10, colors.shadow, 0.12],
      [0, 2, 5, colors.shadow, 0.08],
    ],
    textSize: 'bigger',
  },
  lmedium: {
    dimensions: 50,
    shadow: [
      [0, 4, 12, colors.shadow, 0.12],
      [0, 1, 3, colors.shadow, 0.08],
    ],
    textSize: 28,
  },
  medium: {
    dimensions: 40,
    shadow: [[0, 4, 12, colors.shadow, isDarkMode ? 0.3 : 0.15]],
    textSize: 'larger',
  },
  signing: {
    dimensions: 44,
    shadow: [
      [0, 4, 12, !isDarkMode && accentColor ? accentColor : colors.shadow, isDarkMode ? 0.16 : 0.2],
      [0, 2, 6, colors.trueBlack, 0.02],
    ],
    textSize: 25,
  },
  small: {
    dimensions: 30,
    shadow: [[0, 3, 9, colors.shadow, 0.1]],
    textSize: 'lmedium',
  },
  smaller: {
    dimensions: 20,
    textSize: 'small',
  },
  smaller_shadowless: {
    dimensions: 20,
    textSize: 'small',
    shadow: [[0, 0, 0, colors.shadow, 0]],
  },
  smedium: {
    dimensions: 36,
    shadow: [[0, 4, IS_ANDROID ? 5 : 12, colors.shadow, 0.4]],
    textSize: 'large',
  },
  rewards: {
    dimensions: 36,
    shadow: IS_ANDROID
      ? [[0, 4, 5, colors.shadow, 0.16]]
      : [
          [0, 4, 12, colors.shadow, 0.16],
          [0, 2, 6, colors.shadow, 0.02],
        ],
    textSize: 'large',
  },
  smedium_shadowless: {
    dimensions: 36,
    shadow: [[0, 0, 0, colors.shadow, 0]],
    textSize: 'large',
  },
});

const Avatar = styled(ImgixImage)(({ dimensions }) => ({
  height: dimensions,
  width: dimensions,
}));

const ImageAvatar = ({ image, size = 'medium', onLoad = undefined, ...props }) => {
  const { accentColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();

  const { dimensions, shadow } = useMemo(() => sizeConfigs(accentColor, colors, isDarkMode)[size], [accentColor, colors, isDarkMode, size]);

  const shadows = useMemo(() => (size === 'smaller' ? buildSmallShadows(colors.shadow, colors) : shadow), [shadow, size, colors]);

  return (
    <ShadowStack {...props} {...borders.buildCircleAsObject(dimensions)} backgroundColor={colors.white} shadows={shadows}>
      <Centered flex={1}>
        <Avatar
          onLoad={onLoad}
          dimensions={dimensions}
          source={{
            uri: image,
          }}
          size={100}
        />
      </Centered>
    </ShadowStack>
  );
};
const arePropsEqual = (prev, next) => prev.image === next.image;

export default React.memo(ImageAvatar, arePropsEqual);
