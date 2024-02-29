import { toUpper } from 'lodash';
import React, { useMemo } from 'react';
import { darkModeThemeColors } from '../../styles/colors';
import { useTheme } from '../../theme/ThemeContext';
import { getFirstGrapheme } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';
import { borders } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';
import { IS_ANDROID } from '@/env';
import { useColorMode } from '@/design-system';

const buildShadows = (color, size, darkMode, colors) => {
  if (size === 'small') {
    return [
      [0, 4, 12, !darkMode && color ? colors.avatarBackgrounds[color] || color : colors.shadow, darkMode ? 0.16 : 0.2],
      [0, 2, 6, colors.trueBlack, 0.02],
    ];
  } else if (size === 'smaller' || size === 'smallest') {
    return [[0, 4, 12, darkMode ? darkModeThemeColors.shadow : darkModeThemeColors.avatarBackgrounds[color] || color, 0.3]];
  } else if (size === 'lmedium' || size === 'medium' || size === 'smedium') {
    return [[0, 4, IS_ANDROID ? 5 : 12, darkMode ? colors.shadow : colors.avatarBackgrounds[color] || color, 0.4]];
  } else if (size === 'signing') {
    return [
      [0, 4, 12, darkMode ? colors.shadow : colors.avatarBackgrounds[color] || color, darkMode ? 0.16 : 0.2],
      [0, 2, 6, colors.trueBlack, 0.02],
    ];
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
  sim: {
    dimensions: 44,
    shadow: [
      [0, 4, 6, colors.shadow, 0.04],
      [0, 1, 3, colors.shadow, 0.08],
    ],
    textSize: 'larger',
  },
  medium: {
    dimensions: 40,
    shadow: [
      [0, 4, 6, colors.shadow, 0.04],
      [0, 1, 3, colors.shadow, 0.08],
    ],
    textSize: 'larger',
  },
  signing: {
    dimensions: 44,
    textSize: 25,
  },
  small: {
    dimensions: 36,
    textSize: 'large',
  },
  small_shadowless: {
    dimensions: 36,
    textSize: 'large',
    shadow: [[0, 0, 0, colors.shadow, 0]],
  },
  smaller: {
    dimensions: 20,
    textSize: 'xtiny',
  },
  smedium: {
    dimensions: 36,
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
  smallest: {
    dimensions: 16,
    textSize: 'micro',
  },
});

const ContactAvatar = ({ color, size = 'medium', value, ...props }) => {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const { dimensions, textSize } = useMemo(() => sizeConfigs(colors)[size], [colors, size]);

  const shadows = useMemo(
    () => buildShadows(color, size, props?.forceDarkMode || isDarkMode, colors),
    [color, size, props?.forceDarkMode, isDarkMode, colors]
  );

  const backgroundColor =
    typeof color === 'number'
      ? // sometimes the color is gonna be missing so we fallback to white
        // otherwise there will be only shadows without the the placeholder "circle"
        colors.avatarBackgrounds[color] ?? colors.white
      : color;

  return (
    <ShadowStack {...props} {...borders.buildCircleAsObject(dimensions)} backgroundColor={backgroundColor} shadows={shadows}>
      <Centered flex={1}>
        <Text align="center" color={colors.whiteLabel} letterSpacing="zero" size={textSize} weight="bold">
          {value && getFirstGrapheme(toUpper(value))}
        </Text>
      </Centered>
    </ShadowStack>
  );
};

export default React.memo(ContactAvatar);
