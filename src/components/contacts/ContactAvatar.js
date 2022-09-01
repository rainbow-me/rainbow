import React, { useMemo } from 'react';
import { darkModeThemeColors } from '../../styles/colors';
import { useTheme } from '../../theme/ThemeContext';
import { Centered } from '../layout';
import { Text } from '../text';
import { useRainbowProfile } from '@/hooks';
import { borders } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';
import { isValidAddress } from 'ethereumjs-util';

const buildShadows = (color, size, darkMode, colors) => {
  if (size === 'small') {
    return [
      [0, 3, 5, colors.shadow, 0.14],
      [0, 6, 10, darkMode ? darkModeThemeColors.shadow : color, 0.2],
    ];
  } else if (size === 'smaller') {
    return [[0, 4, 12, darkMode ? darkModeThemeColors.shadow : color, 0.3]];
  } else if (size === 'lmedium' || size === 'medium' || size === 'smedium') {
    return [[0, 4, android ? 5 : 12, darkMode ? colors.shadow : color, 0.4]];
  } else {
    return sizeConfigs(colors)[size]['shadow'];
  }
};

const sizeConfigs = colors => ({
  large: {
    dimensions: 65,
    shadow: [
      [0, 6, 10, colors.shadow, 0.12],
      [0, 2, 5, colors.shadow, 0.08],
    ],
    textSize: 'biggest',
  },
  lmedium: {
    dimensions: 50,
    shadow: [
      [0, 4, 12, colors.shadow, 0.04],
      [0, 1, 3, colors.shadow, 0.08],
    ],
    textSize: 28,
  },
  medium: {
    dimensions: 40,
    shadow: [
      [0, 4, 6, colors.shadow, 0.04],
      [0, 1, 3, colors.shadow, 0.08],
    ],
    textSize: 'larger',
  },
  small: {
    dimensions: 34,
    textSize: 'large',
  },
  smaller: {
    dimensions: 20,
    textSize: 'micro',
  },
  smedium: {
    dimensions: 36,
    textSize: 'large',
  },
});

const ContactAvatar = ({
  address,
  color,
  size = 'medium',
  emoji,
  ...props
}) => {
  const { colors } = useTheme();
  const { rainbowProfile } = useRainbowProfile(address, {
    enabled: !(color && emoji) && isValidAddress(address),
  });
  const profileColor = color || rainbowProfile?.color;
  const profileEmoji = emoji || rainbowProfile?.emoji;
  const { dimensions, textSize } = useMemo(() => sizeConfigs(colors)[size], [
    colors,
    size,
  ]);
  const { isDarkMode } = useTheme();

  const shadows = useMemo(
    () => buildShadows(profileColor, size, isDarkMode, colors),
    [profileColor, size, isDarkMode, colors]
  );

  return (
    <ShadowStack
      {...props}
      {...borders.buildCircleAsObject(dimensions)}
      backgroundColor={profileColor || colors.skeleton}
      shadows={shadows}
    >
      <Centered flex={1}>
        <Text
          align="center"
          color={colors.whiteLabel}
          letterSpacing="zero"
          size={textSize}
          weight="bold"
        >
          {profileEmoji}
        </Text>
      </Centered>
    </ShadowStack>
  );
};

export default React.memo(ContactAvatar);
