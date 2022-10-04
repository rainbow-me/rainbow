import { toUpper } from 'lodash';
import React, { useMemo } from 'react';
import { darkModeThemeColors } from '../../styles/colors';
import { useTheme } from '../../theme/ThemeContext';
import { getFirstGrapheme } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';
import { borders } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';

const buildShadows = (color, size, darkMode, colors) => {
  // TODO: remove `legacySmall` size once rainbow home screen revamp is released
  if (size === 'small' || size === 'legacySmall') {
    return [
      [0, 3, 5, colors.shadow, 0.14],
      [
        0,
        6,
        10,
        darkMode
          ? darkModeThemeColors.shadow
          : darkModeThemeColors.avatarBackgrounds[color] || color,
        0.2,
      ],
    ];
  } else if (size === 'smaller') {
    return [
      [
        0,
        4,
        12,
        darkMode
          ? darkModeThemeColors.shadow
          : darkModeThemeColors.avatarBackgrounds[color] || color,
        0.3,
      ],
    ];
  } else if (size === 'lmedium' || size === 'medium' || size === 'smedium') {
    return [
      [
        0,
        4,
        android ? 5 : 12,
        darkMode ? colors.shadow : colors.avatarBackgrounds[color] || color,
        0.4,
      ],
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
  medium: {
    dimensions: 40,
    shadow: [
      [0, 4, 6, colors.shadow, 0.04],
      [0, 1, 3, colors.shadow, 0.08],
    ],
    textSize: 'larger',
  },
  small: {
    dimensions: 36,
    textSize: 'large',
  },
  // TODO: remove `legacySmall` size once rainbow home screen revamp is released
  legacySmall: {
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

const ContactAvatar = ({ color, size = 'medium', value, ...props }) => {
  const { colors } = useTheme();
  const { dimensions, textSize } = useMemo(() => sizeConfigs(colors)[size], [
    colors,
    size,
  ]);
  const { isDarkMode } = useTheme();

  const shadows = useMemo(() => buildShadows(color, size, isDarkMode, colors), [
    color,
    size,
    isDarkMode,
    colors,
  ]);

  const backgroundColor =
    typeof color === 'number'
      ? // sometimes the color is gonna be missing so we fallback to white
        // otherwise there will be only shadows without the the placeholder "circle"
        colors.avatarBackgrounds[color] ?? 'white'
      : color;

  return (
    <ShadowStack
      {...props}
      {...borders.buildCircleAsObject(dimensions)}
      backgroundColor={backgroundColor}
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
          {value && getFirstGrapheme(toUpper(value))}
        </Text>
      </Centered>
    </ShadowStack>
  );
};

export default React.memo(ContactAvatar);
