import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Centered } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const buildSmallShadows = (color: any, colors: any) => [
  [0, 3, 5, colors.shadow, 0.14],
  [0, 6, 10, colors.avatarBackgrounds[color] || color, 0.2],
];

const sizeConfigs = (colors: any) => ({
  large: {
    dimensions: 65,
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
    textSize: 'small',
  },
});

const Avatar = styled(ImgixImage)`
  height: ${({ dimensions }) => dimensions};
  width: ${({ dimensions }) => dimensions};
`;

const ImageAvatar = ({ image, size = 'medium', ...props }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const { dimensions, shadow } = useMemo(() => sizeConfigs(colors)[size], [
    colors,
    size,
  ]);

  const shadows = useMemo(
    () =>
      size === 'small' || size === 'smaller'
        ? buildSmallShadows(colors.shadow, colors)
        : shadow,
    [shadow, size, colors]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ShadowStack
      {...props}
      {...borders.buildCircleAsObject(dimensions)}
      backgroundColor={colors.white}
      shadows={shadows}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered flex={1}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Avatar
          dimensions={dimensions}
          source={{
            uri: image,
          }}
        />
      </Centered>
    </ShadowStack>
  );
};

export default React.memo(ImageAvatar);
