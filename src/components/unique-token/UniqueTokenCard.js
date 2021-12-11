import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { getLowResUrl } from '../../utils/getLowResUrl';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import UniqueTokenImage from './UniqueTokenImage';
import {
  usePersistentAspectRatio,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';
import { shadow as shadowUtil } from '@rainbow-me/styles';

const UniqueTokenCardBorderRadius = 20;
const UniqueTokenCardShadowFactory = colors => [0, 2, 6, colors.shadow, 0.08];

const Container = styled.View`
  ${({ shadow }) => shadowUtil.build(...shadow)};
`;

const Content = styled.View`
  border-radius: ${UniqueTokenCardBorderRadius};
  height: ${({ height }) => height};
  overflow: hidden;
  width: ${({ width }) => width};
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
}) => {
  const lowResUrl = getLowResUrl(item.image_url);

  usePersistentAspectRatio(item.image_url);
  usePersistentDominantColorFromImage(item.image_url);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(item, lowResUrl);
    }
  }, [item, lowResUrl, onPress]);

  const { colors } = useTheme();

  const defaultShadow = useMemo(() => UniqueTokenCardShadowFactory(colors), [
    colors,
  ]);

  return (
    <Container
      as={ButtonPressAnimation}
      disabled={disabled}
      enableHapticFeedback={enableHapticFeedback}
      onPress={handlePress}
      scaleTo={scaleTo}
      shadow={shadow || defaultShadow}
    >
      <Content {...props} height={height} style={style} width={width}>
        <UniqueTokenImage
          backgroundColor={item.background || colors.lightestGrey}
          imageUrl={lowResUrl}
          isCard
          item={item}
          resizeMode={resizeMode}
          size={width}
          small={smallENSName}
        />
        {borderEnabled && (
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

export default magicMemo(UniqueTokenCard, [
  'height',
  'item.uniqueId',
  'style',
  'width',
]);
