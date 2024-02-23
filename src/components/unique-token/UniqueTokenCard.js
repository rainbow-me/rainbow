import React, { useCallback, useMemo } from 'react';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import { CardSize } from './CardSize';
import UniqueTokenImage from './UniqueTokenImage';
import { usePersistentAspectRatio } from '@/hooks';
import styled from '@/styled-thing';
import { shadow as shadowUtil } from '@/styles';
import isSVGImage from '@/utils/isSVG';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';

const UniqueTokenCardBorderRadius = 20;
const UniqueTokenCardShadowFactory = colors => [0, 2, 6, colors.shadow, 0.08];

const Container = styled.View(({ shadow }) => shadowUtil.buildAsObject(...shadow));

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
  item,
  onPress,
  resizeMode = undefined,
  scaleTo = 0.96,
  shadow = undefined,
  size = CardSize,
  smallENSName = true,
  style = undefined,
  ...props
}) => {
  usePersistentAspectRatio(item.lowResUrl);
  usePersistentDominantColorFromImage(item.lowResUrl);

  const isSVG = isSVGImage(item.image_url);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(item);
    }
  }, [item, onPress]);

  const { colors } = useTheme();

  const defaultShadow = useMemo(() => UniqueTokenCardShadowFactory(colors), [colors]);

  return (
    <Container
      as={ButtonPressAnimation}
      disabled={disabled}
      enableHapticFeedback={enableHapticFeedback}
      onPress={handlePress}
      scaleTo={scaleTo}
      shadow={shadow || defaultShadow}
    >
      <Content {...props} height={size} style={style} width={size}>
        <UniqueTokenImage
          backgroundColor={item.background || colors.lightestGrey}
          imageUrl={item.lowResUrl || item.image_url}
          isCard
          item={item}
          resizeMode={resizeMode}
          small={smallENSName}
        />
        {borderEnabled && <InnerBorder opacity={0.04} radius={UniqueTokenCardBorderRadius} width={0.5} />}
      </Content>
    </Container>
  );
};

export default UniqueTokenCard;
