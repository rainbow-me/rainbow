import { toUpper } from 'lodash';
import React, { useMemo } from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { darkModeThemeColors } from '../../styles/colors';
import { getFirstGrapheme } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const buildShadows = (color: any, size: any, darkMode: any, colors: any) => {
  if (size === 'small') {
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
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        android ? 5 : 12,
        darkMode ? colors.shadow : colors.avatarBackgrounds[color] || color,
        0.4,
      ],
    ];
  } else {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    return sizeConfigs(colors)[size]['shadow'];
  }
};

const sizeConfigs = (colors: any) => ({
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

const ContactAvatar = ({ color, size = 'medium', value, ...props }: any) => {
  const { colors } = useTheme();
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ShadowStack
      {...props}
      {...borders.buildCircleAsObject(dimensions)}
      backgroundColor={colors.avatarBackgrounds[color] || color}
      shadows={shadows}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered flex={1}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
