import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { getLowResUrl } from '../../utils/getLowResUrl';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './UniqueTokenImage' was resolved to '/User... Remove this comment to see the full error message
import UniqueTokenImage from './UniqueTokenImage';
import {
  usePersistentAspectRatio,
  usePersistentDominantColorFromImage,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { shadow as shadowUtil } from '@rainbow-me/styles';

const UniqueTokenCardBorderRadius = 20;
const UniqueTokenCardShadowFactory = (colors: any) => [
  0,
  2,
  6,
  colors.shadow,
  0.08,
];

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  ${({ shadow }: any) => shadowUtil.build(...shadow)};
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Content = styled.View`
  border-radius: ${UniqueTokenCardBorderRadius};
  height: ${({ height }: any) => height};
  overflow: hidden;
  width: ${({ width }: any) => width};
`;

const UniqueTokenCard = ({
  borderEnabled = true,
  disabled,
  enableHapticFeedback = true,
  height,
  item,
  onPress,
  resizeMode,
  scaleTo = 0.96,
  shadow,
  smallENSName = true,
  style,
  width,
  ...props
}: any) => {
  const lowResUrl = getLowResUrl(item.image_url);

  usePersistentAspectRatio(item.image_url);
  usePersistentDominantColorFromImage(item.image_url);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(item, lowResUrl);
    }
  }, [item, lowResUrl, onPress]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const defaultShadow = useMemo(() => UniqueTokenCardShadowFactory(colors), [
    colors,
  ]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      as={ButtonPressAnimation}
      disabled={disabled}
      enableHapticFeedback={enableHapticFeedback}
      onPress={handlePress}
      scaleTo={scaleTo}
      shadow={shadow || defaultShadow}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content {...props} height={height} style={style} width={width}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <UniqueTokenImage
          backgroundColor={item.background || colors.lightestGrey}
          imageUrl={lowResUrl}
          item={item}
          resizeMode={resizeMode}
          shouldRasterizeIOS
          size={width}
          small={smallENSName}
        />
        {borderEnabled && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <InnerBorder
            opacity={0.04}
            radius={UniqueTokenCardBorderRadius}
            width={0.5}
          />
        )}
      </Content>
    </Container>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(UniqueTokenCard, [
  'height',
  'item.uniqueId',
  'style',
  'width',
]);
