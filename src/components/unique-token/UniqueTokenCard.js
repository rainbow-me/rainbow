import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import UniqueTokenImage from './UniqueTokenImage';
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
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(item);
    }
  }, [item, onPress]);

  const { colors } = useTheme();

  const defaultShadow = useMemo(() => UniqueTokenCardShadowFactory(colors), [
    colors,
  ]);

  const imageUrl =
    item.image_preview_url || item.image_url || item.image_original_url;
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
          imageUrl={imageUrl}
          item={item}
          resizeMode={resizeMode}
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
