import React, { useCallback, useMemo } from 'react';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import { CardSize } from './CardSize';
import { UniqueTokenImage } from './UniqueTokenImage';
import { usePersistentAspectRatio } from '@/hooks';
import styled from '@/styled-thing';
import { shadow as shadowUtil } from '@/styles';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { ThemeContextProps, useTheme } from '@/theme';
import { StyleProp, View, ViewStyle } from 'react-native';
import { UniqueAsset } from '@/entities';

const UniqueTokenCardBorderRadius = 20;
const UniqueTokenCardShadowFactory = (colors: ThemeContextProps['colors']) => [0, 2, 6, colors.shadow, 0.08];

const Container = styled(View)(({ shadow }: { shadow: number[] }) => shadowUtil.buildAsObject(...shadow));

const Content = styled(View)({
  borderRadius: UniqueTokenCardBorderRadius,
  height: ({ height }: { height: number }) => height || CardSize,
  overflow: 'hidden',
  width: ({ width }: { width: number }) => width || CardSize,
});

type UniqueTokenCardProps = {
  borderEnabled?: boolean;
  disabled?: boolean;
  enableHapticFeedback?: boolean;
  item: UniqueAsset;
  onPress?: (item: UniqueAsset) => void;
  scaleTo?: number;
  shadow?: number[];
  size?: number;
  style?: StyleProp<ViewStyle>;
};

function parseContractAddressFromUniqueId(uniqueId: string): { address: string } {
  const [, address] = uniqueId.split('_');
  return { address };
}

const UniqueTokenCard = ({
  borderEnabled = true,
  disabled = false,
  enableHapticFeedback = true,
  item,
  onPress,
  scaleTo = 0.96,
  shadow = undefined,
  size = CardSize,
  style = undefined,
  ...props
}: UniqueTokenCardProps) => {
  usePersistentAspectRatio(item.images.lowResUrl);
  usePersistentDominantColorFromImage(item.images.lowResUrl);

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
          backgroundColor={item.backgroundColor || colors.lightestGrey}
          imageUrl={item.images.highResUrl || item.images.animatedUrl}
          isCard
          id={item.tokenId}
          type={item.type}
          collectionName={item.collectionName ?? ''}
          name={item.name}
          uniqueId={item.uniqueId}
          mimeType={item.images.mimeType ?? ''}
          lowResImageUrl={item.images.lowResUrl}
        />
        {borderEnabled && <InnerBorder opacity={0.04} radius={UniqueTokenCardBorderRadius} width={0.5} />}
      </Content>
    </Container>
  );
};

export default UniqueTokenCard;
