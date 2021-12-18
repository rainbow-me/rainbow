import React, { useCallback, useMemo } from 'react';
import styled from '@terrysahaidak/style-thing';
import { getLowResUrl } from '../../utils/getLowResUrl';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import { CardSize } from './CardSize';
import UniqueTokenImage from './UniqueTokenImage';
import {
  usePersistentAspectRatio,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';
import { shadow as shadowUtil } from '@rainbow-me/styles';

const UniqueTokenCardBorderRadius = 20;
const UniqueTokenCardShadowFactory = colors => [0, 2, 6, colors.shadow, 0.08];

const Container = styled.View(({ shadow }) =>
  shadowUtil.buildAsObject(...shadow)
);

const Content = styled.View({
  borderRadius: UniqueTokenCardBorderRadius,
  height: ({ height }) => height || CardSize,
  overflow: 'hidden',
  width: ({ width }) => width || CardSize,
});

const UniqueTokenCard = ({
  borderEnabled = true,
  disabled = false,
  enableHapticFeedback = true,
  height = undefined,
  item,
  onPress,
  resizeMode = undefined,
  scaleTo = 0.96,
  shadow = undefined,
  smallENSName = true,
  style = undefined,
  width = undefined,
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

export default UniqueTokenCard;
