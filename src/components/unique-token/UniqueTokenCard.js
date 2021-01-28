import React, { useCallback } from 'react';
import styled from 'styled-components/primitives';
import use3d from '../../hooks/use3d';
import { magicMemo } from '../../utils';
import { AxisIcon } from '../3d';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import UniqueTokenImage from './UniqueTokenImage';
import { colors, position, shadow as shadowUtil } from '@rainbow-me/styles';

const UniqueTokenCardBorderRadius = 20;
const UniqueTokenCardShadow = [0, 2, 6, colors.dark, 0.08];

const Container = styled.View`
  ${({ shadow }) => shadowUtil.build(...shadow)};
`;

const Content = styled.View`
  border-radius: ${UniqueTokenCardBorderRadius};
  height: ${({ height }) => height};
  overflow: hidden;
  width: ${({ width }) => width};
`;

const Emblems = styled.View`
  position: absolute;
  ${position.size('100%')};
  display: flex;
  padding-horizontal: 10;
  padding-vertical: 10;
  align-items: flex-end;
  justify-content: flex-end;
`;

const UniqueTokenCard = ({
  borderEnabled = true,
  disabled,
  enableHapticFeedback = true,
  height,
  item: { background, image_preview_url, animation_url, ...item },
  onPress,
  resizeMode,
  scaleTo = 0.96,
  shadow = UniqueTokenCardShadow,
  style,
  width,
  ...props
}) => {
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(item);
    }
  }, [item, onPress]);

  const { is3dUri } = use3d();
  const is3dAsset = is3dUri(animation_url);

  return (
    <Container
      as={ButtonPressAnimation}
      disabled={disabled}
      enableHapticFeedback={enableHapticFeedback}
      onPress={handlePress}
      scaleTo={scaleTo}
      shadow={shadow}
    >
      <Content {...props} height={height} style={style} width={width}>
        <UniqueTokenImage
          backgroundColor={background || colors.lightestGrey}
          imageUrl={image_preview_url}
          item={item}
          resizeMode={resizeMode}
        />
        {is3dAsset && (
          <Emblems>
            <AxisIcon
              fill={colors.pinkLight}
              size={16}
              stroke={colors.pinkLight}
              strokeWidth={0}
            />
          </Emblems>
        )}
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
